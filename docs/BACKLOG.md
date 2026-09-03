# BeerChat Backlog

Working backlog for the project. Priority is about what has to exist for the core loop (check in, match, chat) to work, not about how hard the item is.

- P0: needed for the Milestone 1 MVP.
- P1: Milestone 2. Makes the MVP good instead of just working.
- P2: Milestone 3. Shipping and polish.

Points are relative size (1, 2, 3, 5), not hours.

## User stories

| ID | Story | Priority | Points | Milestone | Status |
|----|-------|----------|--------|-----------|--------|
| BC-01 | As a new user, I want to sign up and log in with my email and a password, so that my profile and matches belong to me. | P0 | 3 | 1 | Backlog |
| BC-02 | As a user, I want to set my first name and pick 3 to 5 interest tags, so that people at the venue get a rough idea of what I'm into. | P0 | 2 | 1 | Backlog |
| BC-03 | As a user, I want to see nearby venues on a map, so that I can pick the one I'm going to. | P0 | 3 | 1 | Backlog |
| BC-04 | As a user, I want to check into a bar so that others at the venue know I am open to meeting up. | P0 | 3 | 1 | Backlog |
| BC-05 | As a user, I want to see who else is checked in at the same venue, so that I know who is around right now. | P0 | 3 | 1 | Backlog |
| BC-06 | As a user, I want connections to require both people to agree so that I am not bothered by unwanted messages. | P0 | 5 | 1 | Backlog |
| BC-07 | As a matched user, I want a live 1-on-1 chat, so that we can work out where to find each other. | P0 | 5 | 1 | Backlog |
| BC-08 | As a user, I want the people at my venue sorted by how much our interests overlap, so that the most relevant ones show up first. | P1 | 5 | 2 | Backlog |
| BC-09 | As a user, I want the "who is here" list to update within about half a second, so that I'm not looking at stale information. | P1 | 5 | 2 | Backlog |
| BC-10 | As a user, I want my chats to disappear a while after the meetup, so that nothing I said is sitting around later. | P1 | 2 | 2 | Backlog |
| BC-11 | As a user, I want a plain list of venues as a fallback, so that I can still check in if the map won't load. | P1 | 1 | 1 | Backlog |

## Acceptance criteria (from the proposal)

- BC-04: users do not appear in the venue list until they explicitly check in and toggle visibility on.
- BC-06: expressing interest stays completely private until the second person also opts in.

## Engineering tasks

These are not user stories, just work that has to happen. Listed so it doesn't get lost. Owners follow the split in the proposal.

| ID | Task | Milestone | Owner |
|----|------|-----------|-------|
| T-01 | Expo scaffold, runs clean in the iOS simulator | 1 | Arda (done) |
| T-02 | Supabase project, schema for the five tables, auth turned on | 1 | Margulan |
| T-03 | Seed venue list for the map | 1 | Arda |
| T-04 | Row level security so users can only read the rows they should | 2 | Margulan |
| T-05 | Node + Socket.io presence server | 2 | tbd |
| T-06 | Embedding pipeline: interest tags to OpenAI to pgvector, plus the ranking query | 2 | Karthik |
| T-07 | Automated tests for matching and chat | 2 | Karthik |
| T-08 | CI that runs the tests on every PR | 3 | Karthik |
| T-09 | Hosted deployment for the presence server | 3 | Margulan |
| T-10 | Demo video and final docs | 3 | everyone |

## Out of scope for now

- Background location or sharing exact GPS coordinates.
- Bios, followers, photo feeds, public profiles.
- Group chats, venue ratings, reviews.

## Notes

- BC-11 is in Milestone 1 because of the "map fails to load in simulator" risk in the proposal. It is cheap and it keeps testing unblocked.
- BC-06 and BC-07 are 5 points because both deal with state that two users change at the same time, which is where the bugs will be.
- Status column will get updated as things move. Nothing is in progress yet apart from T-01.
