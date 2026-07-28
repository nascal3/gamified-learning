import "dotenv/config";
import {google} from "googleapis";
import { db } from "@/db/drizzle";
import {courses, lessons} from "@/db/schema";
import { eq } from "drizzle-orm";

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BATCH_SIZE = 50;

// calculate estimated total duration (assuming ~15min per video)
function calculateDuration(videoCount: number) {
    return videoCount * 15;
}

// calculate course points based on difficulty and video count
function calculatePoints(difficulty = 'beginner', videoCount: number) {
    const basePoints =
        difficulty === "beginner"
            ? 500
            : difficulty === "intermediate"
                ? 750 : 1000;
    return basePoints + videoCount * 10;
}

// fetch all playlist from channel
async function fetchChannelPlaylist() {
    if(!CHANNEL_ID) {
        throw new Error("You must specify a valid change ID");
    }

    console.log(`Fetching list from channel...`);
    let allPlaylist: unknown[] = [];
    let pageToken: string | undefined = undefined;

    do {
        try {
            const response: any = await youtube.playlists.list({
                part: ["snippet", "contentDetails"],
                channelId: CHANNEL_ID,
                maxResults: BATCH_SIZE,
                pageToken: pageToken,
            });

            const playlist = response.data.items || [];
            allPlaylist = [...allPlaylist, ...playlist];
            pageToken = response.data.nextPageToken || undefined;

            console.log(`Found ${playlist.length} playlists.`);
        } catch (e) {
            console.error(e);
        }


    }while (pageToken);

    return allPlaylist;
}

// fetch all videos in playlist from channel
async function fetchPlaylistVideos(playlistId: string, playlistTitle: string) {
    console.log(`Fetching videos fro: ${playlistTitle}`);

    let allVideos: unknown[] = [];
    let pageToken: string | undefined = undefined;

    do {
        try {
            const response: any = await youtube.playlistItems.list({
                part: ["snippet", "contentDetails"],
                playlistId: playlistId,
                maxResults: BATCH_SIZE,
                pageToken: pageToken,
            });

            const videos = response.data.items || [];
            allVideos = [...allVideos, ...videos];
            pageToken = response.data.nextPageToken || undefined;
        } catch (e) {
            console.error(e);
        }
    } while (pageToken);

    console.log(`Found ${allVideos.length} videos.`);
    return allVideos;
}

// Seed courses into database
async function seedCoursesFromPlaylists() {
    console.log(`Fetching YouTube content...`);

    //Fetch all playlist
    const playlist = await fetchChannelPlaylist();

    //Filter out system playlists
    const coursePlaylists: any[] = playlist.filter((playlist: any) => {
        const title = playlist.snippet?.title || "";
        // skip system playlist
        const isSystemPlaylist = title === "Uploads" || title === "Liked videos" || title === "Favorites";
        return !isSystemPlaylist;
    });
    console.log(`Processing ${coursePlaylists.length} course playlists...\n`);

    let coursesAdded = 0;
    let lessonsAdded = 0;

    //Process each playlist as a course
    for (const playlist of coursePlaylists) {
        const playlistId = playlist.id;
        const snippet = playlist.snippet;
        const contentDetails = playlist.contentDetails;
        const title = snippet?.title || "Untitled Course";
        const description = snippet.description || `Complete ${title} course for beginners. Learn 
        ${title.toLowerCase()} with practical examples and hands-on projects.`;
        const videoCount = contentDetails.videoCount || 0;
        const thumbnail = snippet?.thumbnail?.high?.url || snippet?.thumbnail?.default?.url || null;
        // const difficulty = determineDifficulty(title);
        const duration = calculateDuration(videoCount);
        const points = calculatePoints('', videoCount)

        console.log(`Processing course: ${title}`);
        // console.log(
        //     `    Videos: ${videoCount}, Difficulty: ${difficulty}, XP: ${points}`,
        // );

        //Check is course already exists
        const [existingCourse] = await db.select().from(courses).where(eq(courses.title, title)).limit(1);

        if (existingCourse) {
            console.log(`Found course: ${title} -- skipping`);
            continue;
        }

        // Insert course
        const [course] = await db.insert(courses).values({
            title: title,
            description: description,
            // difficulty: difficulty,
            duration: duration,
            points: points,
            thumbnail: thumbnail,
        }).returning();

        coursesAdded++;

        //Fetch videos from this playlist
        const videos = await fetchPlaylistVideos(playlistId, title);

        // Insert lessons
        if (videos.length > 0) {
            const lessonValues = videos.map((video: any, index) => {
                const videoSnippet = video.snippet;
                const videoId = video.contentDetails?.videoId;

                return {
                    title: videoSnippet.title || `Lesson ${index + 1}`,
                    content: videoSnippet.description || `Watch this video to learn ${title.toLowerCase()}. Complete tutorial with practical examples`,
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    order: index + 1,
                    courseId: course.id,
                }
            });

            await db.insert(lessons).values(lessonValues);
            lessonsAdded += lessonValues.length + 1;
        }

        console.log(`Added ${videos.length} lessons.\n`);
    }
    console.log("✨ Import complete!");
    console.log(`   📚 Courses added: ${coursesAdded}`);
    console.log(`   📹 Lessons added: ${lessonsAdded}`);
}

//Run the import
seedCoursesFromPlaylists().then(() => {
    console.log(`Fetching YouTube content complete :)`);
    process.exit();
}).catch((error) => {
    console.error(error);
    process.exit();
});
