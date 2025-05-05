# Recent Changes

## UI Changes: Archives Feature

### Completed
- Changed the "Completed" tab to "Archives" throughout the application
- Added a text-based "View Archives" link at the bottom of all tab views instead of having it as a tab
- Modified the badge in event cards from "Completed" to "Archived"
- Added toggle functionality to the archives link ("View Archives" / "Back to Active Events")
- Fixed date comparison logic in the event card component for better stability

### File Changes
- `client/src/components/view-selector.tsx`: Added text-based "View Archives" link
- `client/src/components/event-card.tsx`: Changed "Completed" badge to "Archived" 
- Fixed date comparison logic for past events

### Technical Notes
- Implemented the archives link to toggle between active events and archived events
- The UI now shows the View Archives link at the bottom of the tabs panel
- When clicked, it toggles to show archived events and the link text changes to "Back to Active Events"