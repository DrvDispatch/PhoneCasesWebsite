# GlobeCase — Client change request (2026-07-09)

Source: private Google Doc (read via authenticated browser). Original is Flemish/Dutch.
User instruction: **do all of these EXCEPT the email part** (point 12; confirm scope of 22).

## Original (verbatim, Dutch)

1. Fotos juist croppen, zodat volledige foto mooi zichtbaar is
2. 4 regios 1 pagina, zodat je meer regios per scherm ziet
3. Beter maken voor gsm, mooier en alles beetje kleiner zodat je goed en duidelijk alles ziet
4. Promotie codes, zodat ik die kan managen in admin mode als dat mogelijk is
5. als mogelijk in admin mode voor producten alle beschrijvingen tegelijk veranderen en altijd als standaart read only "phone case" zodat ik alleen land naam moet schrijven
6. Eventueel meerdere fotos voor producten // carousel. Ook eventueel dat ze voor elke product tegelijk automatisch hetzelfde zijn zodat ik het niet apart moet doen per product. Maar eventueel wel als keuze om toch apart
7. Ik ga zelf ook nog fotos veranderen, kan je die in de site doen? Of kan ik dat zelf doen
8. Trust bar (Worldwide free shipping / 7-day returns / 5% donated / Secure checkout): Emojis beter met zwarte of goude (die je al gebruikte) logos – en haal 5% donatie weg, k ben gierig
9. Gewoon text dat veranderd moet worden, kan ik op zich zelf; ook sommige kleuren zijn niet contrast met achtergrond en moeilijk te lezen
10. "Find your country" search bar beter vanboven, anders gaan mensen dat niet zien en das makkelijker
11. Reviews worden die automatisch geupdate? Zo niet, geef mij toegang om te updaten en toon foto's van google reviews; ook een link knop naar mijn Maps Business
12. [EMAIL — SKIP] Email knop werkt niet. Makkelijkst om gewoon mijn email te gebruiken voor alles. globecase.mail@gmail.com
13. Voor elke product 3 fotos voor design-keuze, getoond als Keuze 1/2/3 bij bestelling; 1:1 vierkantjes boven qty, groene rand bij aanduiden
14. Product pagina: emojis weg, vervang met zwarte of goude outlined icoontjes; goed doel weg; maar 1 lijn (zelfde lijn als scherm groot genoeg), middel outlined
15. Bij cart alleen de gekozen hoesje tonen (foto van de keuze), niet 3
16. Stripe account moet aan de mijne gekoppeld worden
17. Buy 2 get 1 free, automatisch toegepast op elk product; motiverende text onder de keuzes/qty maar boven emojis
18. Gelimiteerd merkaanbod (vooral Apple en Samsung) via dropdown: eerst merk kiezen (kleine dropdown), dan tweede dropdown met modellen van dat merk. Mooi gestyled
19. Verplaats TikTok en Insta naar "social media"; add Telegram bij contact (optioneel/onzeker)
20. Onder elke product een slider met alle andere producten (shop-kaartjes). Text: "Don't forget a present for your family and friends / 2+1 free" (voorlopig)
21. Home: automatisch updatebare review counter + sterretjes; 5 review-foto's 1:1; plaats onder trust bar (emojis) en boven "search for country". [refereert screenshot]
22. Home: promo 5% korting i.r.v. subscriben aan promo-emails op eerste bestelling; verzamel subscriber-emails; unsubscribe link/manueel verwijderen. [refereert screenshot]

## English gist (working translation)

1. Crop product photos so the FULL image is visible (no bad cropping).
2. Show 4 regions per row/screen.
3. Mobile polish: prettier, smaller, clearer.
4. Promo/discount codes, managed in admin.
5. Admin bulk-edit all product descriptions; fixed read-only "phone case" so admin only types the country name.
6. Multiple product photos / carousel; option to bulk-apply same images to all products, with per-product override.
7. Client will also change some photos himself — wants to know if he can do it (admin upload).
8. Trust bar: replace emojis with black/gold icons (existing style); REMOVE the "5% donated" item.
9. Fix low-contrast/hard-to-read text colors (text edits he can do himself).
10. Move "Find your country" search bar to the top.
11. Reviews: admin-manageable; show Google-review photos; add a button linking to his Google Maps business.
12. [EMAIL — SKIP per user]
13. Per product: 3 design-choice thumbnails (1:1 squares above qty, green border when selected), recorded on order as Choice 1/2/3.
14. Product page trust badges: replace emojis with black/gold outlined icons, remove charity, keep them on a single row on wide screens.
15. Cart shows only the chosen design photo (not all 3).
16. Connect the client's OWN Stripe account (needs his keys).
17. Buy-2-get-1-free auto-applied to every product; motivating text below choices/qty but above the trust badges.
18. Two-step model selector dropdown: brand (Apple/Samsung, limited) → model of that brand. Nicely styled.
19. Move TikTok & Instagram under "social media"; add Telegram to contact (optional/uncertain).
20. Product page cross-sell slider of all other products (shop cards) with a heading.
21. Home: auto-updating review counter + stars + 5 square review photos, placed below the trust bar and above the country search. (screenshot referenced)
22. Home: newsletter promo — 5% off first order for subscribing; collect subscriber emails; unsubscribe. (screenshot referenced)

## Decisions (confirmed by user 2026-07-09)
- **#12 email**: SKIP (the broken email button / switch-to-gmail confusion).
- **#22 newsletter**: BUILD FULLY, incl. sending — signup box + 5% first-order code + subscriber admin list + welcome/promo email via existing Resend engine + unsubscribe. (This is separate from the #12 skip.)
- **#17 buy-2-get-1**: CART-WIDE — every 3rd case in the cart is free (cheapest free; all €20 flat).
- **Discounts (#4+#17)**: handled on OUR cart (not Stripe's promo box) so codes + B2G1 coexist and each order records the discount.
- **Icons (#8/#14)**: hand-built outlined SVGs (gold/black), no icon-library dependency.
- **Model list (#18)**: seed recent Apple + Samsung models, admin-editable later.
- Deploy behind the maintenance page; go-live is the user's call.

## Still needed from client (build slots now, fill later)
- #16 client's Stripe keys (secret, publishable, webhook secret).
- #13 three design photos per product (or a default set).
- #6 any extra product gallery photos.
- #11/#21 Google Maps business URL + 5 review photos.
- #19 Telegram link.
- Embedded screenshots in #21/#22 not yet viewed — grab visually before finalizing those layouts.
