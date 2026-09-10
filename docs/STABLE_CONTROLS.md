# Stable development controls — U72

The previous/next buttons now reserve the same position throughout a species' eleven-stage cycle. The caption area takes the intrinsic height of the longest caption at the current width/font size; the counter reserves room for two-digit stages. This avoids hard-coded text heights and keeps the restart control in the next-button position.

Checked in Chromium and Linux WebKit 26.5: all eight species × eleven stages × four viewports (390×844, 1024×768, 844×390, 1536×864). Both arrows retain x/y/width/height within one CSS pixel. A separate phone/tablet check passes for 200% text, local scrolling, stage selection and reachable actions. Physical-device testing is not claimed.

Main inspected fresh phone, tablet and short-landscape renders in `tmp/stable-arrows-capture/`. The image remains uncropped and the arrows remain touch-sized. Artwork, biological content and manual navigation are unchanged.

A later full WebKit stress run exposed a History API rate limit, not moving arrows. The navigation commit guard now keeps URL and UI together; main repeated all four all-species/four-size position cases successfully and passed 14 quota/cancellation cases per engine. [Cause, correction and separate capture-test limits](HISTORY_NAVIGATION.md).

An initial mixed-edit regression run found a duplicate selector caused by the hidden caption measurement and excessive counter width under enlarged text; both were corrected. Two other failures occurred while concurrent hot reloads were changing the application. That run is not final regression evidence; the settled full-suite result belongs in the implementation status.

Reproduce position checks:

```sh
npx playwright test tests/browser/development-immersion.spec.ts --grep 'arrows stay anchored' --project=phone
npm run test:webkit -- tests/browser/development-immersion.spec.ts --grep 'arrows stay anchored' --project=phone
```

The test itself checks all four viewport sizes regardless of the project name. WebKit requires the matching browser installed with `npx playwright install webkit`.
