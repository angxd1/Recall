# Demo script (45–60 seconds)

## Props checklist

- [ ] Printed grocery receipt listing ~6 products including **ABC Granola Bars**
- [ ] Physical package (or printed label) showing **LOT A1842** (within A1800–A1900)
- [ ] Phone with Expo / development build of RecallLens
- [ ] API running on laptop (`npm run api`) reachable from phone (`EXPO_PUBLIC_API_URL` if needed)
- [ ] Optional: Health Canada sync once before the demo for “live data” talking point

## Judge walkthrough

1. **Receipt** — Open RecallLens → Scan receipt → photograph the prepared receipt  
   (or tap **Use demo receipt** if camera/OCR is flaky)  
   → Confirm **6 products identified** → Add to My Products

2. **New recall** — Demo controls → **Inject demo recall + match**  
   Home shows **Potential recall detected**

3. **Alert** — Open the alert → ABC Granola Bars, purchased today →  
   copy says package verification required (not yet confirmed)

4. **Verify** — Hand the judge the package → Check Product →  
   enter/scan **A1842** (or tap **Demo: use package lot A1842**)

5. **Action** — **RECALL CONFIRMED** → why (Salmonella) → what to do →  
   lot match → open official notice link

## Reset between runs

Demo controls → **Reset inventory**, then reload demo receipt + inject again.
