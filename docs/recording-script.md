# SceneRack recording guide

Target: **2 minutes 40 seconds**, within the event's 1–3 minute demo requirement. Record the functioning app, with your voice. Start with the problem, why it matters, how it is solved and the result. Keep the mouse still while speaking.

App: [SceneRack](https://scenerack.abhinav-0905.chatgpt.site). Source: [Abhinav0905/scenerack](https://github.com/Abhinav0905/scenerack).

## Before recording

- Open the deployed SceneRack app. Sign in before recording if this instance is private. The judge-facing link must be accessible before submission; an owner-only preview is not public access.
- Use a clean browser window. Hide unrelated tabs, email, bookmarks and notifications. Never show the YouCam key dashboard or local runtime files.
- Choose **Reset sample**, then confirm **Reset sample**. Saved YouCam results remain available. Make sure the total is **$65** and the budget is **$80**.
- Open **Preview room → Maya → Brown chore jacket** once. Confirm the original photo and the real saved result load. The label must remain visible.
- Return to the top. Use a 1440×900 or 1920×1080 capture region. Browser zoom around 100% is a starting point; enlarge if the recording makes labels hard to read.
- Record a quick ten-second audio test. Use a quiet room and speak naturally. No background music is needed.
- On macOS, **Shift–Command–5 → Record Selected Portion** opens the built-in screen recorder. In Options, choose your microphone and destination. Crop to the app, then record. This guide does not change recording or microphone permissions for you.

## The 2:40 take

| Time | What to show and click | What to say |
| --- | --- | --- |
| 0:00–0:20 | Landing page. Hold on "One jacket. Two actors. One scene." | "A small theatre production can have a good costume idea and still have an impossible wardrobe. Two actors want the same jacket in the same scene. Finding that out at the fitting means another rental or a rushed change. I built SceneRack to catch that decision before the production spends." |
| 0:20–0:42 | **Solve the sample production**. Point to Maya and Leo's first-scene cells, then the **$65** total. | "Here are three performers, three scenes and eight physical pieces. Maya and Leo both prefer the only navy blazer. They share the opening scene, so they cannot both use it. With the existing approvals, the plan needs this sixty-five-dollar burgundy rental." |
| 0:42–1:05 | **Review alternative**. Show original Maya, saved YouCam result and garment thumbnail. | "There is an owned brown jacket on the rack. YouCam Clothes v4 previews that exact reference on Maya's photo. This is a saved result from a real API request, clearly labeled. I can also request a fresh preview or replace the source photos. The image helps me judge the appearance. It does not tell me whether the jacket physically fits." |
| 1:05–1:22 | Enter note "The worn brown jacket suits the archivist." Click **Approve this look**. Hold on the new **$0** total. | "The brown jacket suits the archivist, so I approve it. That decision changes the allocation. Maya gets brown. Leo gets navy. The rental is no longer needed. The modeled acquisition cost drops from sixty-five dollars to zero." |
| 1:22–1:43 | Click **Scene board**, then **Pull & rent**. Show the three rows. Click **Export pull list**. | "The scene board now has a feasible assignment for every performer. The pull list says who wears each piece, which scenes need it and where it comes from. Each physical item is counted once, even across several scenes. I can export the list for the wardrobe team." |
| 1:43–2:00 | Back to **Preview room → Maya → Brown**. Click **Reject the look**. Hold on **$65**. Reapprove to finish on the valid owned plan. | "The director still has the final say. If I reject the look, the rental returns. If I withdraw a garment or lower the budget, the planner checks those constraints too. It never quietly uses an unapproved item to make the numbers look better." |
| 2:00–2:22 | Select **Leo**, then **Brown chore jacket**. Show the rolled cuffs. Click **Flag preview quality**. | "A bad image is a different decision. In this result, the model added rolled cuffs that are not in the original jacket. I flag the preview instead of rejecting the physical garment. The look stays unresolved until someone reviews the reference or does a fitting." |
| 2:22–2:40 | Open **Build & evidence**, show results/checks briefly. End on the pull list if time allows. | "The build completed twelve real YouCam renders. Eleven were useful for limited appearance review; one needed that flag. Twenty-three planning and admission checks and eighteen HTTP checks cover stock, budget, approvals and data boundaries. These are sample costs, not claimed customer savings. SceneRack turns a visual decision into a costume plan the production can act on." |

Read this aloud once. If your pace runs over three minutes, shorten the last paragraph to: "Twelve real YouCam renders and forty-one automated checks support the prototype. Next, a costume lead needs to test it with real stock. SceneRack turns a visual decision into a plan the production can act on."

## Optional fresh-generation insert

The main take is honest with recorded results. A fresh request makes the integration easier to assess if time permits:

1. In Maya/brown, select **Send these sample photos to YouCam again** and **Generate a fresh preview · 2 units**.
2. Record the pending state and completed result. The twelve fixture requests took about 11–22 seconds with polling; a later request can take longer.
3. Keep this in the main take if it fits. Otherwise use a clear jump cut caption: **"Waiting for YouCam, elapsed time shown in app."** Do not make a saved result look newly generated.
4. Avoid repeated fresh requests for rehearsals. Once a live request succeeds in your workspace, it is reused without spending again. Resetting the sample keeps it.

## Export and handoff

Export H.264 MP4, 1080p, 30 fps if your recorder offers those settings. Check the entire exported file: voice, cursor, text, correct costs, visible result labels and no private browser material. Upload it to a public or unlisted host without a viewing password, then test the video while signed out. Do not submit a local file path as the demo URL.

The video has not been recorded or uploaded by this build. The script and app are ready for a take. If recording is delegated later, use this same story and keep the live-versus-saved distinction visible.
