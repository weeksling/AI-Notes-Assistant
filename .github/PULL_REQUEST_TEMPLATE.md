# 🚀 Pull Request

## Description
<!-- Background agents: Please provide a clear, concise summary of the changes made -->
<!-- Include the specific issue being addressed or feature being added -->

## Type of change
<!-- Background agents: Mark all that apply by changing [ ] to [x] -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactor (code change that neither fixes a bug nor adds a feature)
- [ ] Documentation update
- [ ] Chore / maintenance (dependency updates, build script changes, etc.)
- [ ] Performance improvement
- [ ] Security enhancement

## How Has This Been Tested?
<!-- Background agents: Describe the testing performed. Use this checklist: -->

### Automated Testing
- [ ] TypeScript compilation passed (`npm run typecheck`)
- [ ] Android build completed successfully (`npx expo prebuild --platform android && cd android && ./gradlew assembleDebug`)
- [ ] Web version loads without errors (`expo start --web`)
- [ ] Basic app startup test passed (no immediate crashes)

### Manual Testing (if applicable)
- [ ] Tested on Android emulator
- [ ] Tested on iOS simulator  
- [ ] Verified UI renders correctly
- [ ] Tested core functionality works as expected

### Build & Deployment
- [ ] APK builds successfully
- [ ] App installs and opens on Android device/emulator
- [ ] No console errors during basic usage
- [ ] Performance is acceptable

## Screenshots / UI Changes (if applicable)
<!-- Background agents: If UI changes were made, include before/after screenshots -->
<!-- You can use: | Before | After | format if needed -->

## Android Testing Results
<!-- Background agents: Include results from automated Android testing if performed -->

### Build Status
- [ ] Debug APK builds successfully
- [ ] Release APK builds successfully (if applicable)
- [ ] App size is reasonable (< 200MB for debug, < 100MB for release)

### Emulator Testing
- [ ] App installs on Android emulator
- [ ] App launches without immediate crash
- [ ] Basic navigation works
- [ ] Core features are accessible

### Performance & Stability
- [ ] App startup time is reasonable (< 10 seconds)
- [ ] No memory leaks detected during basic usage
- [ ] App handles screen rotation properly
- [ ] Back button navigation works correctly

## Code Quality Checklist
<!-- Background agents: Verify these items -->

- [ ] Code follows TypeScript best practices
- [ ] No hardcoded sensitive data (API keys, secrets, etc.)
- [ ] Error handling is implemented appropriately  
- [ ] Comments added for complex logic
- [ ] No unused imports or variables
- [ ] Consistent code formatting
- [ ] No TODO comments left in production code

## Dependencies & Security
<!-- Background agents: Check for dependency-related issues -->

- [ ] No new security vulnerabilities introduced
- [ ] New dependencies are justified and minimal
- [ ] Package versions are pinned appropriately
- [ ] No deprecated packages used

## Related Issues
<!-- Background agents: Link to related issues using "Closes #123" format -->
Closes #

## Notes for Reviewers
<!-- Background agents: Add any additional context, known limitations, or follow-up tasks -->

### Known Limitations
<!-- List any known issues or limitations -->

### Follow-up Tasks
<!-- List any tasks that should be done in future PRs -->

### Testing Notes
<!-- Any specific testing instructions or areas that need extra attention -->

---

<!-- Background agents: This template is designed to be filled out automatically. -->
<!-- Ensure all applicable checkboxes are marked and all sections have relevant content. -->
