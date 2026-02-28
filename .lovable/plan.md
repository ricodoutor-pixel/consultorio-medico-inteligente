

## Analysis

The library images are blank because `source.unsplash.com` has been **discontinued** by Unsplash. The current code generates URLs like `https://source.unsplash.com/300x300/?cannabis,bud,flower,macro,...` which return nothing.

The Verdinho mascot prompt requests a major visual upgrade: royal outfit, luxury cars orbiting, 5 AI personality modes in the chat, and enhanced animations.

## Plan

### Task 1: Fix Library Images (all 100 cards)
- Replace the broken `source.unsplash.com` URLs in `src/data/strains.ts` with working image sources
- Use `picsum.photos` with seed-based URLs as primary source (guaranteed to work, high-quality botanical/nature photos)
- Keep the `pollinations.ai` fallback for cannabis-specific AI-generated images
- Update `getPlantImage()` to use `https://image.pollinations.ai/prompt/` directly as primary source with cannabis-specific prompts per strain (e.g., "cannabis flower bud macro photo, Purple Kush, dense trichomes, professional photography")
- Each of the 100 strains gets a unique prompt incorporating its name and type (Indica/Sativa/Hybrid) for visual variety

### Task 2: Upgrade Verdinho Mascot Visual (`src/components/FrogMascot.tsx`)
- Add royal purple mantle/robe to the SVG body
- Add golden buttons on the robe
- Add a scepter (golden staff with red orb)
- Add 4 orbiting luxury car emojis (Ferrari, Lamborghini, Porsche, Tesla) rotating around the mascot
- Enhance existing animations with celebrate and thinking states
- Keep all current functionality (eye tracking, blinking, personalities)

### Task 3: Upgrade Chat Modal with 5 Personalities (`src/components/FrogChatModal.tsx`)
- Implement personality detection: analyze user message keywords to select one of 5 modes (Médico, Coach, Psicólogo, Admin, Amigo)
- Create personality-specific response banks:
  - **Médico**: symptoms, diseases, medications → professional medical guidance with disclaimer
  - **Coach**: fitness, nutrition, habits → motivational tips
  - **Psicólogo**: emotions, anxiety, stress → empathetic coping techniques
  - **Admin**: scheduling, payment, features → platform navigation help
  - **Amigo**: casual, jokes → fun responses with emojis
- Display current personality mode badge in chat header
- Show personality indicator on each AI message bubble
- Expand cached responses from ~12 to 50+ keyword-matched answers across all 5 personalities

### Task 4: Verify "Saiba Mais" Button
- Already present in BibliotecaCientifica.tsx (lines 168-178), linking to `/profissionais`
- No changes needed, already functional

### Files Modified
1. `src/data/strains.ts` — Replace broken image URLs with working AI-generated cannabis flower images
2. `src/components/FrogMascot.tsx` — Add royal outfit, scepter, orbiting cars, new animations
3. `src/components/FrogChatModal.tsx` — Add 5-personality system with expanded response bank and UI indicators

