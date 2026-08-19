-- ============================================================================
-- Sadhana Connect — Phase 11 enrichment: local Verse of the Day content
--
-- Adds the Sanskrit transliteration and Śrīla Prabhupāda's translation for
-- each of the 108 curated daily selections already scheduled in
-- public.verse_citations (0002_verse_of_the_day.sql), so a devotee can read
-- the basic verse without leaving the app. This migration does NOT modify
-- 0002 in any way — public.verse_citations, its order_index values, its
-- scheduled_date/is_published/source_url columns, and its RLS are all
-- untouched. VedaBase (via source_url) remains the canonical destination
-- for the full verse page and the purport, which this application still
-- does not store or display.
--
-- Content source: the user-supplied Markdown
-- ("Bhagavad-gītā As It Is — Selected Verses", A.C. Bhaktivedanta Swami
-- Prabhupada), reconciled verse-by-verse against the exact existing
-- 108-row schedule before this migration was written (see the Phase 11
-- enrichment reconciliation report). No verse was added to or removed from
-- the schedule to produce this content, no combined selection (e.g.
-- "12.6-7") was split into multiple rows, and no text was fetched from
-- VedaBase, drawn from another translation, paraphrased, or invented.
--
-- Wrapped in an explicit transaction for atomicity, matching 0001/0002.
-- ============================================================================

begin;

-- ============================================================================
-- 1. verse_contents
--
-- One row per verse_citations row — a strict 1:1 relationship, hence
-- verse_citation_id is itself the primary key (not a separate surrogate id
-- with a unique constraint bolted on). Kept as its own table rather than
-- adding columns to verse_citations: citation metadata (chapter, verse
-- number, source URL, rotation order) and the licensed translation text
-- are different concerns with different authorization/maintenance
-- lifecycles, and separating them keeps verse_citations exactly as
-- 0002 defined it.
--
-- on delete cascade: if a citation row were ever removed, its content has
-- no independent meaning and should not be orphaned. (In practice
-- verse_citations rows are append-only per 0002's own documentation, so
-- this is a safety property, not an expected operation.)
-- ============================================================================

create table if not exists public.verse_contents (
  verse_citation_id uuid primary key references public.verse_citations (id) on delete cascade,
  sanskrit_transliteration text not null,
  translation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verse_contents_sanskrit_not_blank check (char_length(trim(sanskrit_transliteration)) > 0),
  constraint verse_contents_translation_not_blank check (char_length(trim(translation)) > 0)
);

-- The primary key above already provides the only index this table needs
-- (every lookup is by verse_citation_id, whether standalone or via the
-- verse_citations embed the application queries through).

-- ============================================================================
-- 2. updated_at trigger
--
-- Reuses public.set_updated_at(), already defined in 0001_initial_schema —
-- no new trigger function.
-- ============================================================================

create or replace trigger trg_verse_contents_set_updated_at
  before update on public.verse_contents
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. RLS enablement
-- ============================================================================

alter table public.verse_contents enable row level security;

-- ============================================================================
-- 4. RLS policy — SELECT only, no new authorization logic
--
-- Deliberately does NOT duplicate the is_published / private.is_devotee()
-- checks from verse_citations_select (0002), and deliberately does NOT
-- introduce a new SECURITY DEFINER helper. Instead this policy's USING
-- clause queries verse_citations directly — and because that query runs
-- under RLS with the CALLING role's own privileges (this is not a
-- self-referential policy, so there is no recursion risk the way a
-- table's policy referencing itself would have), verse_citations_select
-- already filters that subquery down to exactly the rows this same caller
-- is allowed to see there. A row is visible in verse_contents if and only
-- if its parent row is visible in verse_citations — the existing policy is
-- the single source of truth for that decision, not re-implemented here.
--
-- No INSERT/UPDATE/DELETE policy exists for any role: Postgres RLS
-- defaults to denying an operation entirely when no policy grants it,
-- matching verse_citations' own "content authoring is Super Admin scope,
-- not yet implemented" stance (0002). Seed rows are inserted directly by
-- migration SQL, as below.
--
-- `to authenticated` (not `public`/`anon`) means an unauthenticated caller
-- is denied before the policy is even evaluated.
-- ============================================================================

drop policy if exists verse_contents_select on public.verse_contents;
create policy verse_contents_select
  on public.verse_contents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.verse_citations vc
      where vc.id = verse_contents.verse_citation_id
    )
  );

-- ============================================================================
-- 5. Exact least-privilege table grant
--
-- SELECT only — there is no INSERT/UPDATE/DELETE policy for any role, so
-- no corresponding grant is given either, matching 0002's own grant
-- section exactly in spirit.
-- ============================================================================

grant select on public.verse_contents to authenticated;

-- ============================================================================
-- 6. Seed data — content for the existing 108-row curated schedule
--
-- Exactly one row per public.verse_citations row, resolved by order_index
-- (1-108, matching 0002's own seed block one-to-one) rather than by a
-- hardcoded UUID, since verse_citations.id values are generated at insert
-- time and are not known in advance. If a given order_index somehow did
-- not exist, the subquery would return NULL and the NOT NULL primary key
-- would reject the row outright rather than silently doing nothing.
--
-- Combined schedule selections (12.6-7, 12.13-14, 13.1-2, 13.8-12, 15.3-4,
-- 16.1-3) get exactly one content row each, not one per component verse —
-- the Markdown source repeats byte-identical Sanskrit/translation text
-- under each component heading for these (matching how Prabhupāda's own
-- book presents them as a single combined translation), and this seed
-- takes that text once per combined row, never concatenated or duplicated.
--
-- Mechanical normalization only, applied uniformly by the parsing script
-- that generated these values from the source Markdown: Markdown emphasis
-- markers and section labels stripped, internal line breaks/whitespace
-- collapsed to single spaces, values trimmed. The single confirmed
-- formatting artifact — a stray leading quotation mark immediately before
-- the 4.34 Sanskrit block, with no matching closing quote anywhere in the
-- source — was removed; no other character was added, removed, or
-- reworded. Diacritics are preserved exactly as supplied, and the inline
-- (8)...(12) sub-verse markers within the single 13.8-12 combined block
-- are preserved exactly as the source presents them.
--
-- ON CONFLICT (verse_citation_id) DO NOTHING makes this block replay-safe,
-- matching 0002's own seed block.
-- ============================================================================

insert into public.verse_contents
  (verse_citation_id, sanskrit_transliteration, translation)
values
  ((select id from public.verse_citations where order_index = 1), 'dhṛtarāṣṭra uvāca dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya', 'Dhṛtarāṣṭra said: O Sañjaya, after my sons and the sons of Pāṇḍu assembled in the place of pilgrimage at Kurukṣetra, desiring to fight, what did they do?'), -- 1.1
  ((select id from public.verse_citations where order_index = 2), 'arjuna uvāca dṛṣṭvemaṁ sva-janaṁ kṛṣṇa yuyutsuṁ samupasthitam sīdanti mama gātrāṇi mukhaṁ ca pariśuṣyati', 'Arjuna said: My dear Kṛṣṇa, seeing my friends and relatives present before me in such a fighting spirit, I feel the limbs of my body quivering and my mouth drying up.'), -- 1.28
  ((select id from public.verse_citations where order_index = 3), 'sañjaya uvāca evam uktvārjunaḥ saṅkhye rathopastha upāviśat visṛjya sa-śaraṁ cāpaṁ śoka-saṁvigna-mānasaḥ', 'Sañjaya said: Arjuna, having thus spoken on the battlefield, cast aside his bow and arrows and sat down on the chariot, his mind overwhelmed with grief.'), -- 1.46
  ((select id from public.verse_citations where order_index = 4), 'śrī-bhagavān uvāca aśocyān anvaśocas tvaṁ prajñā-vādāṁś ca bhāṣase gatāsūn agatāsūṁś ca nānuśocanti paṇḍitāḥ', 'The Supreme Personality of Godhead said: While speaking learned words, you are mourning for what is not worthy of grief. Those who are wise lament neither for the living nor for the dead.'), -- 2.11
  ((select id from public.verse_citations where order_index = 5), 'na tv evāhaṁ jātu nāsaṁ na tvaṁ neme janādhipāḥ na caiva na bhaviṣyāmaḥ sarve vayam ataḥ param', 'Never was there a time when I did not exist, nor you, nor all these kings; nor in the future shall any of us cease to be.'), -- 2.12
  ((select id from public.verse_citations where order_index = 6), 'dehino ’smin yathā dehe kaumāraṁ yauvanaṁ jarā tathā dehāntara-prāptir dhīras tatra na muhyati', 'As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.'), -- 2.13
  ((select id from public.verse_citations where order_index = 7), 'mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ āgamāpāyino ’nityās tāṁs titikṣasva bhārata', 'O son of Kuntī, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. They arise from sense perception, O scion of Bharata, and one must learn to tolerate them without being disturbed.'), -- 2.14
  ((select id from public.verse_citations where order_index = 8), 'na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ ajo nityaḥ śāśvato ’yaṁ purāṇo na hanyate hanyamāne śarīre', 'For the soul there is neither birth nor death at any time. He has not come into being, does not come into being, and will not come into being. He is unborn, eternal, ever-existing and primeval. He is not slain when the body is slain.'), -- 2.20
  ((select id from public.verse_citations where order_index = 9), 'vāsāṁsi jīrṇāni yathā vihāya navāni gṛhṇāti naro ’parāṇi tathā śarīrāṇi vihāya jīrṇāny anyāni saṁyāti navāni dehī', 'As a person puts on new garments, giving up old ones, the soul similarly accepts new material bodies, giving up the old and useless ones.'), -- 2.22
  ((select id from public.verse_citations where order_index = 10), 'nainaṁ chindanti śastrāṇi nainaṁ dahati pāvakaḥ na cainaṁ kledayanty āpo na śoṣayati mārutaḥ', 'The soul can never be cut to pieces by any weapon, nor burned by fire, nor moistened by water, nor withered by the wind.'), -- 2.23
  ((select id from public.verse_citations where order_index = 11), 'jātasya hi dhruvo mṛtyur dhruvaṁ janma mṛtasya ca tasmād aparihārye ’rthe na tvaṁ śocitum arhasi', 'One who has taken his birth is sure to die, and after death one is sure to take birth again. Therefore, in the unavoidable discharge of your duty, you should not lament.'), -- 2.27
  ((select id from public.verse_citations where order_index = 12), 'karmaṇy evādhikāras te mā phaleṣu kadācana mā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi', 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.'), -- 2.47
  ((select id from public.verse_citations where order_index = 13), 'yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya siddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate', 'Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure. Such equanimity is called yoga.'), -- 2.48
  ((select id from public.verse_citations where order_index = 14), 'dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate saṅgāt sañjāyate kāmaḥ kāmāt krodho ’bhijāyate', 'While contemplating the objects of the senses, a person develops attachment for them, and from such attachment lust develops, and from lust anger arises.'), -- 2.62
  ((select id from public.verse_citations where order_index = 15), 'vihāya kāmān yaḥ sarvān pumāṁś carati niḥspṛhaḥ nirmamo nirahaṅkāraḥ sa śāntim adhigacchati', 'A person who has given up all desires for sense gratification, who lives free from desires, who has given up all sense of proprietorship and is devoid of false ego—he alone can attain real peace.'), -- 2.71
  ((select id from public.verse_citations where order_index = 16), 'na hi kaścit kṣaṇam api jātu tiṣṭhaty akarma-kṛt kāryate hy avaśaḥ karma sarvaḥ prakṛti-jair guṇaiḥ', 'Everyone is forced to act helplessly according to the qualities he has acquired from the modes of material nature; therefore no one can refrain from doing something, not even for a moment.'), -- 3.5
  ((select id from public.verse_citations where order_index = 17), 'yajñārthāt karmaṇo ’nyatra loko ’yaṁ karma-bandhanaḥ tad-arthaṁ karma kaunteya mukta-saṅgaḥ samācara', 'Work done as a sacrifice for Viṣṇu has to be performed, otherwise work causes bondage in this material world. Therefore, O son of Kuntī, perform your prescribed duties for His satisfaction, and in that way you will always remain free from bondage.'), -- 3.9
  ((select id from public.verse_citations where order_index = 18), 'tasmād asaktaḥ satataṁ kāryaṁ karma samācara asakto hy ācaran karma param āpnoti pūruṣaḥ', 'Therefore, without being attached to the fruits of activities, one should act as a matter of duty, for by working without attachment one attains the Supreme.'), -- 3.19
  ((select id from public.verse_citations where order_index = 19), 'yad yad ācarati śreṣṭhas tat tad evetaro janaḥ sa yat pramāṇaṁ kurute lokas tad anuvartate', 'Whatever action a great man performs, common men follow. And whatever standards he sets by exemplary acts, all the world pursues.'), -- 3.21
  ((select id from public.verse_citations where order_index = 20), 'prakṛteḥ kriyamāṇāni guṇaiḥ karmāṇi sarvaśaḥ ahaṅkāra-vimūḍhātmā kartāham iti manyate', 'The spirit soul bewildered by the influence of false ego thinks himself the doer of activities that are in actuality carried out by the three modes of material nature.'), -- 3.27
  ((select id from public.verse_citations where order_index = 21), 'śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt sva-dharme nidhanaṁ śreyaḥ para-dharmo bhayāvahaḥ', 'It is far better to discharge one’s prescribed duties, even though faultily, than another’s duties perfectly. Destruction in the course of performing one’s own duty is better than engaging in another’s duties, for to follow another’s path is dangerous.'), -- 3.35
  ((select id from public.verse_citations where order_index = 22), 'yadā yadā hi dharmasya glānir bhavati bhārata abhyutthānam adharmasya tadātmānaṁ sṛjāmy aham', 'Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion—at that time I descend Myself.'), -- 4.7
  ((select id from public.verse_citations where order_index = 23), 'paritrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām dharma-saṁsthāpanārthāya sambhavāmi yuge yuge', 'To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.'), -- 4.8
  ((select id from public.verse_citations where order_index = 24), 'janma karma ca me divyam evaṁ yo vetti tattvataḥ tyaktvā dehaṁ punar janma naiti mām eti so ’rjuna', 'One who knows the transcendental nature of My appearance and activities does not, upon leaving the body, take his birth again in this material world, but attains My eternal abode, O Arjuna.'), -- 4.9
  ((select id from public.verse_citations where order_index = 25), 'ye yathā māṁ prapadyante tāṁs tathaiva bhajāmy aham mama vartmānuvartante manuṣyāḥ pārtha sarvaśaḥ', 'As all surrender unto Me, I reward them accordingly. Everyone follows My path in all respects, O son of Pṛthā.'), -- 4.11
  ((select id from public.verse_citations where order_index = 26), 'tad viddhi praṇipātena paripraśnena sevayā upadekṣyanti te jñānaṁ jñāninas tattva-darśinaḥ', 'Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him. The self-realized souls can impart knowledge unto you because they have seen the truth.'), -- 4.34
  ((select id from public.verse_citations where order_index = 27), 'na hi jñānena sadṛśaṁ pavitram iha vidyate tat svayaṁ yoga-saṁsiddhaḥ kālenātmani vindati', 'In this world, there is nothing so sublime and pure as transcendental knowledge. Such knowledge is the mature fruit of all mysticism. And one who has become accomplished in the practice of devotional service enjoys this knowledge within himself in due course of time.'), -- 4.38
  ((select id from public.verse_citations where order_index = 28), 'śrī-bhagavān uvāca sannyāsaḥ karma-yogaś ca niḥśreyasa-karāv ubhau tayos tu karma-sannyāsāt karma-yogo viśiṣyate', 'The Personality of Godhead replied: The renunciation of work and work in devotion are both good for liberation. But, of the two, work in devotional service is better than renunciation of work.'), -- 5.2
  ((select id from public.verse_citations where order_index = 29), 'brahmaṇy ādhāya karmāṇi saṅgaṁ tyaktvā karoti yaḥ lipyate na sa pāpena padma-patram ivāmbhasā', 'One who performs his duty without attachment, surrendering the results unto the Supreme Lord, is unaffected by sinful action, as the lotus leaf is untouched by water.'), -- 5.10
  ((select id from public.verse_citations where order_index = 30), 'vidyā-vinaya-sampanne brāhmaṇe gavi hastini śuni caiva śva-pāke ca paṇḍitāḥ sama-darśinaḥ', 'The humble sages, by virtue of true knowledge, see with equal vision a learned and gentle brāhmaṇa, a cow, an elephant, a dog and a dog-eater [outcaste].'), -- 5.18
  ((select id from public.verse_citations where order_index = 31), 'bhoktāraṁ yajña-tapasāṁ sarva-loka-maheśvaram suhṛdaṁ sarva-bhūtānāṁ jñātvā māṁ śāntim ṛcchati', 'A person in full consciousness of Me, knowing Me to be the ultimate beneficiary of all sacrifices and austerities, the Supreme Lord of all planets and demigods, and the benefactor and well-wisher of all living entities, attains peace from the pangs of material miseries.'), -- 5.29
  ((select id from public.verse_citations where order_index = 32), 'uddhared ātmanātmānaṁ nātmānam avasādayet ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ', 'One must deliver himself with the help of his mind, and not degrade himself. The mind is the friend of the conditioned soul, and his enemy as well.'), -- 6.5
  ((select id from public.verse_citations where order_index = 33), 'yathā dīpo nivāta-stho neṅgate sopamā smṛtā yogino yata-cittasya yuñjato yogam ātmanaḥ', 'As a lamp in a windless place does not waver, so the transcendentalist, whose mind is controlled, remains always steady in his meditation on the transcendent self.'), -- 6.19
  ((select id from public.verse_citations where order_index = 34), 'yato yato niścalati manaś cañcalam asthiram tatas tato niyamyaitad ātmany eva vaśaṁ nayet', 'From wherever the mind wanders due to its flickering and unsteady nature, one must certainly withdraw it and bring it back under the control of the self.'), -- 6.26
  ((select id from public.verse_citations where order_index = 35), 'yo māṁ paśyati sarvatra sarvaṁ ca mayi paśyati tasyāhaṁ na praṇaśyāmi sa ca me na praṇaśyati', 'For one who sees Me everywhere and sees everything in Me, I am never lost, nor is he ever lost to Me.'), -- 6.30
  ((select id from public.verse_citations where order_index = 36), 'śrī-bhagavān uvāca asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate', 'Lord Śrī Kṛṣṇa said: O mighty-armed son of Kuntī, it is undoubtedly very difficult to curb the restless mind, but it is possible by suitable practice and by detachment.'), -- 6.35
  ((select id from public.verse_citations where order_index = 37), 'yoginām api sarveṣāṁ mad-gatenāntar-ātmanā śraddhāvān bhajate yo māṁ sa me yuktatamo mataḥ', 'And of all yogīs, the one with great faith who always abides in Me, thinks of Me within himself, and renders transcendental loving service to Me—he is the most intimately united with Me in yoga and is the highest of all. That is My opinion.'), -- 6.47
  ((select id from public.verse_citations where order_index = 38), 'manuṣyāṇāṁ sahasreṣu kaścid yatati siddhaye yatatām api siddhānāṁ kaścin māṁ vetti tattvataḥ', 'Out of many thousands among men, one may endeavor for perfection, and of those who have achieved perfection, hardly one knows Me in truth.'), -- 7.3
  ((select id from public.verse_citations where order_index = 39), 'mattaḥ parataraṁ nānyat kiñcid asti dhanañjaya mayi sarvam idaṁ protaṁ sūtre maṇi-gaṇā iva', 'O conqueror of wealth, there is no truth superior to Me. Everything rests upon Me, as pearls are strung on a thread.'), -- 7.7
  ((select id from public.verse_citations where order_index = 40), 'daivī hy eṣā guṇa-mayī mama māyā duratyayā mām eva ye prapadyante māyām etāṁ taranti te', 'This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who have surrendered unto Me can easily cross beyond it.'), -- 7.14
  ((select id from public.verse_citations where order_index = 41), 'bahūnāṁ janmanām ante jñānavān māṁ prapadyate vāsudevaḥ sarvam iti sa mahātmā su-durlabhaḥ', 'After many births and deaths, he who is actually in knowledge surrenders unto Me, knowing Me to be the cause of all causes and all that is. Such a great soul is very rare.'), -- 7.19
  ((select id from public.verse_citations where order_index = 42), 'icchā-dveṣa-samutthena dvandva-mohena bhārata sarva-bhūtāni sammohaṁ sarge yānti parantapa', 'O scion of Bharata, O conqueror of the foe, all living entities are born into delusion, bewildered by dualities arisen from desire and hate.'), -- 7.27
  ((select id from public.verse_citations where order_index = 43), 'sādhibhūtādhidaivaṁ māṁ sādhiyajñaṁ ca ye viduḥ prayāṇa-kāle ’pi ca māṁ te vidur yukta-cetasaḥ', 'Those in full consciousness of Me, who know Me, the Supreme Lord, to be the governing principle of the material manifestation, of the demigods, and of all methods of sacrifice, can understand and know Me, the Supreme Personality of Godhead, even at the time of death.'), -- 7.30
  ((select id from public.verse_citations where order_index = 44), 'anta-kāle ca mām eva smaran muktvā kalevaram yaḥ prayāti sa mad-bhāvaṁ yāti nāsty atra saṁśayaḥ', 'And whoever, at the end of his life, quits his body, remembering Me alone, at once attains My nature. Of this there is no doubt.'), -- 8.5
  ((select id from public.verse_citations where order_index = 45), 'yaṁ yaṁ vāpi smaran bhāvaṁ tyajaty ante kalevaram taṁ tam evaiti kaunteya sadā tad-bhāva-bhāvitaḥ', 'Whatever state of being one remembers when he quits his body, O son of Kuntī, that state he will attain without fail.'), -- 8.6
  ((select id from public.verse_citations where order_index = 46), 'tasmāt sarveṣu kāleṣu mām anusmara yudhya ca mayy arpita-mano-buddhir mām evaiṣyasy asaṁśayaḥ', 'Therefore, Arjuna, you should always think of Me in the form of Kṛṣṇa and at the same time carry out your prescribed duty of fighting. With your activities dedicated to Me and your mind and intelligence fixed on Me, you will attain Me without doubt.'), -- 8.7
  ((select id from public.verse_citations where order_index = 47), 'mām upetya punar janma duḥkhālayam aśāśvatam nāpnuvanti mahātmānaḥ saṁsiddhiṁ paramāṁ gatāḥ', 'After attaining Me, the great souls, who are yogīs in devotion, never return to this temporary world, which is full of miseries, because they have attained the highest perfection.'), -- 8.15
  ((select id from public.verse_citations where order_index = 48), 'vedeṣu yajñeṣu tapaḥsu caiva dāneṣu yat puṇya-phalaṁ pradiṣṭam atyeti tat sarvam idaṁ viditvā yogī paraṁ sthānam upaiti cādyam', 'A person who accepts the path of devotional service is not bereft of the results derived from studying the Vedas, performing austere sacrifices, giving charity or pursuing philosophical and fruitive activities. Simply by performing devotional service, he attains all these, and at the end he reaches the supreme eternal abode.'), -- 8.28
  ((select id from public.verse_citations where order_index = 49), 'rāja-vidyā rāja-guhyaṁ pavitram idam uttamam pratyakṣāvagamaṁ dharmyaṁ su-sukhaṁ kartum avyayam', 'This knowledge is the king of education, the most secret of all secrets. It is the purest knowledge, and because it gives direct perception of the self by realization, it is the perfection of religion. It is everlasting, and it is joyfully performed.'), -- 9.2
  ((select id from public.verse_citations where order_index = 50), 'mayā tatam idaṁ sarvaṁ jagad avyakta-mūrtinā mat-sthāni sarva-bhūtāni na cāhaṁ teṣv avasthitaḥ', 'By Me, in My unmanifested form, this entire universe is pervaded. All beings are in Me, but I am not in them.'), -- 9.4
  ((select id from public.verse_citations where order_index = 51), 'mahātmānas tu māṁ pārtha daivīṁ prakṛtim āśritāḥ bhajanty ananya-manaso jñātvā bhūtādim avyayam', 'O son of Pṛthā, those who are not deluded, the great souls, are under the protection of the divine nature. They are fully engaged in devotional service because they know Me as the Supreme Personality of Godhead, original and inexhaustible.'), -- 9.13
  ((select id from public.verse_citations where order_index = 52), 'ananyāś cintayanto māṁ ye janāḥ paryupāsate teṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham', 'But those who always worship Me with exclusive devotion, meditating on My transcendental form—to them I carry what they lack, and I preserve what they have.'), -- 9.22
  ((select id from public.verse_citations where order_index = 53), 'patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati tad ahaṁ bhakty-upahṛtam aśnāmi prayatātmanaḥ', 'If one offers Me with love and devotion a leaf, a flower, fruit or water, I will accept it.'), -- 9.26
  ((select id from public.verse_citations where order_index = 54), 'yat karoṣi yad aśnāsi yaj juhoṣi dadāsi yat yat tapasyasi kaunteya tat kuruṣva mad-arpaṇam', 'Whatever you do, whatever you eat, whatever you offer or give away, and whatever austerities you perform—do that, O son of Kuntī, as an offering to Me.'), -- 9.27
  ((select id from public.verse_citations where order_index = 55), 'samo ’haṁ sarva-bhūteṣu na me dveṣyo ’sti na priyaḥ ye bhajanti tu māṁ bhaktyā mayi te teṣu cāpy aham', 'I envy no one, nor am I partial to anyone. I am equal to all. But whoever renders service unto Me in devotion is a friend, is in Me, and I am also a friend to him.'), -- 9.29
  ((select id from public.verse_citations where order_index = 56), 'man-manā bhava mad-bhakto mad-yājī māṁ namaskuru mām evaiṣyasi yuktvaivam ātmānaṁ mat-parāyaṇaḥ', 'Engage your mind always in thinking of Me, become My devotee, offer obeisances to Me and worship Me. Being completely absorbed in Me, surely you will come to Me.'), -- 9.34
  ((select id from public.verse_citations where order_index = 57), 'ahaṁ sarvasya prabhavo mattaḥ sarvaṁ pravartate iti matvā bhajante māṁ budhā bhāva-samanvitāḥ', 'I am the source of all spiritual and material worlds. Everything emanates from Me. The wise who perfectly know this engage in My devotional service and worship Me with all their hearts.'), -- 10.8
  ((select id from public.verse_citations where order_index = 58), 'mac-cittā mad-gata-prāṇā bodhayantaḥ parasparam kathayantaś ca māṁ nityaṁ tuṣyanti ca ramanti ca', 'The thoughts of My pure devotees dwell in Me, their lives are fully devoted to My service, and they derive great satisfaction and bliss from always enlightening one another and conversing about Me.'), -- 10.9
  ((select id from public.verse_citations where order_index = 59), 'teṣāṁ satata-yuktānāṁ bhajatāṁ prīti-pūrvakam dadāmi buddhi-yogaṁ taṁ yena mām upayānti te', 'To those who are constantly devoted to serving Me with love, I give the understanding by which they can come to Me.'), -- 10.10
  ((select id from public.verse_citations where order_index = 60), 'aham ātmā guḍākeśa sarva-bhūtāśaya-sthitaḥ aham ādiś ca madhyaṁ ca bhūtānām anta eva ca', 'I am the Supersoul, O Arjuna, seated in the hearts of all living entities. I am the beginning, the middle and the end of all beings.'), -- 10.20
  ((select id from public.verse_citations where order_index = 61), 'yad yad vibhūtimat sattvaṁ śrīmad ūrjitam eva vā tat tad evāvagaccha tvaṁ mama tejo-’ṁśa-sambhavam', 'Know that all opulent, beautiful and glorious creations spring from but a spark of My splendor.'), -- 10.41
  ((select id from public.verse_citations where order_index = 62), 'atha vā bahunaitena kiṁ jñātena tavārjuna viṣṭabhyāham idaṁ kṛtsnam ekāṁśena sthito jagat', 'But what need is there, Arjuna, for all this detailed knowledge? With a single fragment of Myself I pervade and support this entire universe.'), -- 10.42
  ((select id from public.verse_citations where order_index = 63), 'ihaika-sthaṁ jagat kṛtsnaṁ paśyādya sa-carācaram mama dehe guḍākeśa yac cānyad draṣṭum icchasi', 'O Arjuna, whatever you wish to see, behold at once in this body of Mine! This universal form can show you whatever you now desire to see and whatever you may want to see in the future. Everything—moving and nonmoving—is here completely, in one place.'), -- 11.7
  ((select id from public.verse_citations where order_index = 64), 'śrī-bhagavān uvāca kālo ’smi loka-kṣaya-kṛt pravṛddho lokān samāhartum iha pravṛttaḥ ṛte ’pi tvāṁ na bhaviṣyanti sarve ye ’vasthitāḥ pratyanīkeṣu yodhāḥ', 'The Supreme Personality of Godhead said: Time I am, the great destroyer of the worlds, and I have come here to destroy all people. With the exception of you [the Pāṇḍavas], all the soldiers here on both sides will be slain.'), -- 11.32
  ((select id from public.verse_citations where order_index = 65), 'tasmāt tvam uttiṣṭha yaśo labhasva jitvā śatrūn bhuṅkṣva rājyaṁ samṛddham mayaivaite nihatāḥ pūrvam eva nimitta-mātraṁ bhava savya-sācin', 'Therefore get up. Prepare to fight and win glory. Conquer your enemies and enjoy a flourishing kingdom. They are already put to death by My arrangement, and you, O Savyasācī, can be but an instrument in the fight.'), -- 11.33
  ((select id from public.verse_citations where order_index = 66), 'tasmāt praṇamya praṇidhāya kāyaṁ prasādaye tvām aham īśam īḍyam piteva putrasya sakheva sakhyuḥ priyaḥ priyāyārhasi deva soḍhum', 'You are the Supreme Lord, to be worshiped by every living being. Thus I fall down to offer You my respectful obeisances and ask Your mercy. As a father tolerates the impudence of his son, or a friend tolerates the impertinence of a friend, or a wife tolerates the familiarity of her partner, please tolerate the wrongs I may have done You.'), -- 11.44
  ((select id from public.verse_citations where order_index = 67), 'bhaktyā tv ananyayā śakya aham evaṁ-vidho ’rjuna jñātuṁ draṣṭuṁ ca tattvena praveṣṭuṁ ca parantapa', 'My dear Arjuna, only by undivided devotional service can I be understood as I am, standing before you, and can thus be seen directly. Only in this way can you enter into the mysteries of My understanding.'), -- 11.54
  ((select id from public.verse_citations where order_index = 68), 'mat-karma-kṛn mat-paramo mad-bhaktaḥ saṅga-varjitaḥ nirvairaḥ sarva-bhūteṣu yaḥ sa mām eti pāṇḍava', 'My dear Arjuna, he who engages in My pure devotional service, free from the contaminations of fruitive activities and mental speculation, he who works for Me, who makes Me the supreme goal of his life, and who is friendly to every living being—he certainly comes to Me.'), -- 11.55
  ((select id from public.verse_citations where order_index = 69), 'śrī-bhagavān uvāca mayy āveśya mano ye māṁ nitya-yuktā upāsate śraddhayā parayopetās te me yuktatamā matāḥ', 'The Supreme Personality of Godhead said: Those who fix their minds on My personal form and are always engaged in worshiping Me with great and transcendental faith are considered by Me to be most perfect.'), -- 12.2
  ((select id from public.verse_citations where order_index = 70), 'ye tu sarvāṇi karmāṇi mayi sannyasya mat-parāḥ ananyenaiva yogena māṁ dhyāyanta upāsate teṣām ahaṁ samuddhartā mṛtyu-saṁsāra-sāgarāt bhavāmi na cirāt pārtha mayy āveśita-cetasām', 'But those who worship Me, giving up all their activities unto Me and being devoted to Me without deviation, engaged in devotional service and always meditating upon Me, having fixed their minds upon Me, O son of Pṛthā—for them I am the swift deliverer from the ocean of birth and death.'), -- 12.6-7
  ((select id from public.verse_citations where order_index = 71), 'mayy eva mana ādhatsva mayi buddhiṁ niveśaya nivasiṣyasi mayy eva ata ūrdhvaṁ na saṁśayaḥ', 'Just fix your mind upon Me, the Supreme Personality of Godhead, and engage all your intelligence in Me. Thus you will live in Me always, without a doubt.'), -- 12.8
  ((select id from public.verse_citations where order_index = 72), 'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca nirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī santuṣṭaḥ satataṁ yogī yatātmā dṛḍha-niścayaḥ mayy arpita-mano-buddhir yo mad-bhaktaḥ sa me priyaḥ', 'One who is not envious but is a kind friend to all living entities, who does not think himself a proprietor and is free from false ego, who is equal in both happiness and distress, who is tolerant, always satisfied, self-controlled, and engaged in devotional service with determination, his mind and intelligence fixed on Me—such a devotee of Mine is very dear to Me.'), -- 12.13-14
  ((select id from public.verse_citations where order_index = 73), 'yasmān nodvijate loko lokān nodvijate ca yaḥ harṣāmarṣa-bhayodvegair mukto yaḥ sa ca me priyaḥ', 'He for whom no one is put into difficulty and who is not disturbed by anyone, who is equipoised in happiness and distress, fear and anxiety, is very dear to Me.'), -- 12.15
  ((select id from public.verse_citations where order_index = 74), 'ye tu dharmāmṛtam idaṁ yathoktaṁ paryupāsate śraddadhānā mat-paramā bhaktās te ’tīva me priyāḥ', 'Those who follow this imperishable path of devotional service and who completely engage themselves with faith, making Me the supreme goal, are very, very dear to Me.'), -- 12.20
  ((select id from public.verse_citations where order_index = 75), 'arjuna uvāca prakṛtiṁ puruṣaṁ caiva kṣetraṁ kṣetra-jñam eva ca etad veditum icchāmi jñānaṁ jñeyaṁ ca keśava śrī-bhagavān uvāca idaṁ śarīraṁ kaunteya kṣetram ity abhidhīyate etad yo vetti taṁ prāhuḥ kṣetra-jña iti tad-vidaḥ', 'Arjuna said: O my dear Kṛṣṇa, I wish to know about prakṛti [nature], puruṣa [the enjoyer], and the field and the knower of the field, and of knowledge and the object of knowledge. The Supreme Personality of Godhead said: This body, O son of Kuntī, is called the field, and one who knows this body is called the knower of the field.'), -- 13.1-2
  ((select id from public.verse_citations where order_index = 76), '(8) amānitvam adambhitvam ahiṁsā kṣāntir ārjavam ācāryopāsanaṁ śaucaṁ sthairyam ātma-vinigrahaḥ (9) indriyārtheṣu vairāgyam anahaṅkāra eva ca janma-mṛtyu-jarā-vyādhi- duḥkha-doṣānudarśanam (10) asaktir anabhiṣvaṅgaḥ putra-dāra-gṛhādiṣu nityaṁ ca sama-cittatvam iṣṭāniṣṭopapattiṣu (11) mayi cānanya-yogena bhaktir avyabhicāriṇī vivikta-deśa-sevitvam aratir jana-saṁsadi (12) adhyātma-jñāna-nityatvaṁ tattva-jñānārtha-darśanam etaj jñānam iti proktam ajñānaṁ yad ato ’nyathā', 'Humility; pridelessness; nonviolence; tolerance; simplicity; approaching a bona fide spiritual master; cleanliness; steadiness; self-control; renunciation of the objects of sense gratification; absence of false ego; the perception of the evil of birth, death, old age and disease; detachment; freedom from entanglement with children, wife, home and the rest; even-mindedness amid pleasant and unpleasant events; constant and unalloyed devotion to Me; aspiring to live in a solitary place; detachment from the general mass of people; accepting the importance of self-realization; and philosophical search for the Absolute Truth—all these I declare to be knowledge, and besides this whatever there may be is ignorance.'), -- 13.8-12
  ((select id from public.verse_citations where order_index = 77), 'puruṣaḥ prakṛti-stho hi bhuṅkte prakṛti-jān guṇān kāraṇaṁ guṇa-saṅgo ’sya sad-asad-yoni-janmasu', 'The living entity in material nature thus follows the ways of life, enjoying the three modes of nature. This is due to his association with that material nature. Thus he meets with good and evil among various species.'), -- 13.22
  ((select id from public.verse_citations where order_index = 78), 'samaṁ sarveṣu bhūteṣu tiṣṭhantaṁ parameśvaram vinaśyatsv avinaśyantaṁ yaḥ paśyati sa paśyati', 'One who sees the Supersoul accompanying the individual soul in all bodies, and who understands that neither the soul nor the Supersoul within the destructible body is ever destroyed, actually sees.'), -- 13.28
  ((select id from public.verse_citations where order_index = 79), 'yathā prakāśayaty ekaḥ kṛtsnaṁ lokam imaṁ raviḥ kṣetraṁ kṣetrī tathā kṛtsnaṁ prakāśayati bhārata', 'O son of Bharata, as the sun alone illuminates all this universe, so does the living entity, one within the body, illuminate the entire body by consciousness.'), -- 13.34
  ((select id from public.verse_citations where order_index = 80), 'sattvaṁ rajas tama iti guṇāḥ prakṛti-sambhavāḥ nibadhnanti mahā-bāho dehe dehinam avyayam', 'Material nature consists of three modes—goodness, passion and ignorance. When the eternal living entity comes in contact with nature, O mighty-armed Arjuna, he becomes conditioned by these modes.'), -- 14.5
  ((select id from public.verse_citations where order_index = 81), 'sattvaṁ sukhe sañjayati rajaḥ karmaṇi bhārata jñānam āvṛtya tu tamaḥ pramāde sañjayaty uta', 'O son of Bharata, the mode of goodness conditions one to happiness; passion conditions one to fruitive action; and ignorance, covering one’s knowledge, binds one to madness.'), -- 14.9
  ((select id from public.verse_citations where order_index = 82), 'nānyaṁ guṇebhyaḥ kartāraṁ yadā draṣṭānupaśyati guṇebhyaś ca paraṁ vetti mad-bhāvaṁ so ’dhigacchati', 'When one properly sees that in all activities no other performer is at work than these modes of nature and he knows the Supreme Lord, who is transcendental to all these modes, he attains My spiritual nature.'), -- 14.19
  ((select id from public.verse_citations where order_index = 83), 'māṁ ca yo ’vyabhicāreṇa bhakti-yogena sevate sa guṇān samatītyaitān brahma-bhūyāya kalpate', 'One who engages in full devotional service, unfailing in all circumstances, at once transcends the modes of material nature and thus comes to the level of Brahman.'), -- 14.26
  ((select id from public.verse_citations where order_index = 84), 'brahmaṇo hi pratiṣṭhāham amṛtasyāvyayasya ca śāśvatasya ca dharmasya sukhasyaikāntikasya ca', 'And I am the basis of the impersonal Brahman, which is immortal, imperishable and eternal and is the constitutional position of ultimate happiness.'), -- 14.27
  ((select id from public.verse_citations where order_index = 85), 'śrī-bhagavān uvāca ūrdhva-mūlam adhaḥ-śākham aśvatthaṁ prāhur avyayam chandāṁsi yasya parṇāni yas taṁ veda sa veda-vit', 'The Supreme Personality of Godhead said: It is said that there is an imperishable banyan tree that has its roots upward and its branches down and whose leaves are the Vedic hymns. One who knows this tree is the knower of the Vedas.'), -- 15.1
  ((select id from public.verse_citations where order_index = 86), 'na rūpam asyeha tathopalabhyate nānto na cādir na ca sampratiṣṭhā aśvattham enaṁ su-virūḍha-mūlam asaṅga-śastreṇa dṛḍhena chittvā tataḥ padaṁ tat parimārgitavyaṁ yasmin gatā na nivartanti bhūyaḥ tam eva cādyaṁ puruṣaṁ prapadye yataḥ pravṛttiḥ prasṛtā purāṇī', 'The real form of this tree cannot be perceived in this world. No one can understand where it ends, where it begins, or where its foundation is. But with determination one must cut down this strongly rooted tree with the weapon of detachment. Thereafter, one must seek that place from which, having gone, one never returns, and there surrender to that Supreme Personality of Godhead from whom everything began and from whom everything has extended since time immemorial.'), -- 15.3-4
  ((select id from public.verse_citations where order_index = 87), 'mamaivāṁśo jīva-loke jīva-bhūtaḥ sanātanaḥ manaḥ-ṣaṣṭhānīndriyāṇi prakṛti-sthāni karṣati', 'The living entities in this conditioned world are My eternal fragmental parts. Due to conditioned life, they are struggling very hard with the six senses, which include the mind.'), -- 15.7
  ((select id from public.verse_citations where order_index = 88), 'sarvasya cāhaṁ hṛdi sanniviṣṭo mattaḥ smṛtir jñānam apohanaṁ ca vedaiś ca sarvair aham eva vedyo vedānta-kṛd veda-vid eva cāham', 'I am seated in everyone’s heart, and from Me come remembrance, knowledge and forgetfulness. By all the Vedas, I am to be known. Indeed, I am the compiler of Vedānta, and I am the knower of the Vedas.'), -- 15.15
  ((select id from public.verse_citations where order_index = 89), 'yasmāt kṣaram atīto ’ham akṣarād api cottamaḥ ato ’smi loke vede ca prathitaḥ puruṣottamaḥ', 'Because I am transcendental, beyond both the fallible and the infallible, and because I am the greatest, I am celebrated both in the world and in the Vedas as that Supreme Person.'), -- 15.18
  ((select id from public.verse_citations where order_index = 90), 'yo mām evam asammūḍho jānāti puruṣottamam sa sarva-vid bhajati māṁ sarva-bhāvena bhārata', 'Whoever knows Me as the Supreme Personality of Godhead, without doubting, is the knower of everything. He therefore engages himself in full devotional service to Me, O son of Bharata.'), -- 15.19
  ((select id from public.verse_citations where order_index = 91), 'śrī-bhagavān uvāca abhayaṁ sattva-saṁśuddhir jñāna-yoga-vyavasthitiḥ dānaṁ damaś ca yajñaś ca svādhyāyas tapa ārjavam ahiṁsā satyam akrodhas tyāgaḥ śāntir apaiśunam dayā bhūteṣv aloluptvaṁ mārdavaṁ hrīr acāpalam tejaḥ kṣamā dhṛtiḥ śaucam adroho nāti-mānitā bhavanti sampadaṁ daivīm abhijātasya bhārata', 'The Supreme Personality of Godhead said: Fearlessness; purification of one’s existence; cultivation of spiritual knowledge; charity; self-control; performance of sacrifice; study of the Vedas; austerity; simplicity; nonviolence; truthfulness; freedom from anger; renunciation; tranquillity; aversion to faultfinding; compassion for all living entities; freedom from covetousness; gentleness; modesty; steady determination; vigor; forgiveness; fortitude; cleanliness; and freedom from envy and from the passion for honor—these transcendental qualities, O son of Bharata, belong to godly men endowed with divine nature.'), -- 16.1-3
  ((select id from public.verse_citations where order_index = 92), 'daivī sampad vimokṣāya nibandhāyāsurī matā mā śucaḥ sampadaṁ daivīm abhijāto ’si pāṇḍava', 'The transcendental qualities are conducive to liberation, whereas the demoniac qualities make for bondage. Do not worry, O son of Pāṇḍu, for you are born with the divine qualities.'), -- 16.5
  ((select id from public.verse_citations where order_index = 93), 'tri-vidhaṁ narakasyedaṁ dvāraṁ nāśanam ātmanaḥ kāmaḥ krodhas tathā lobhas tasmād etat trayaṁ tyajet', 'There are three gates leading to this hell—lust, anger and greed. Every sane man should give these up, for they lead to the degradation of the soul.'), -- 16.21
  ((select id from public.verse_citations where order_index = 94), 'tasmāc chāstraṁ pramāṇaṁ te kāryākārya-vyavasthitau jñātvā śāstra-vidhānoktaṁ karma kartum ihārhasi', 'One should therefore understand what is duty and what is not duty by the regulations of the scriptures. Knowing such rules and regulations, one should act so that he may gradually be elevated.'), -- 16.24
  ((select id from public.verse_citations where order_index = 95), 'sattvānurūpā sarvasya śraddhā bhavati bhārata śraddhā-mayo ’yaṁ puruṣo yo yac-chraddhaḥ sa eva saḥ', 'O son of Bharata, according to one’s existence under the various modes of nature, one evolves a particular kind of faith. The living being is said to be of a particular faith according to the modes he has acquired.'), -- 17.3
  ((select id from public.verse_citations where order_index = 96), 'anudvega-karaṁ vākyaṁ satyaṁ priya-hitaṁ ca yat svādhyāyābhyasanaṁ caiva vāṅ-mayaṁ tapa ucyate', 'Austerity of speech consists in speaking words that are truthful, pleasing, beneficial, and not agitating to others, and also in regularly reciting Vedic literature.'), -- 17.15
  ((select id from public.verse_citations where order_index = 97), 'dātavyam iti yad dānaṁ dīyate ’nupakāriṇe deśe kāle ca pātre ca tad dānaṁ sāttvikaṁ smṛtam', 'Charity given out of duty, without expectation of return, at the proper time and place, and to a worthy person is considered to be in the mode of goodness.'), -- 17.20
  ((select id from public.verse_citations where order_index = 98), 'aśraddhayā hutaṁ dattaṁ tapas taptaṁ kṛtaṁ ca yat asad ity ucyate pārtha na ca tat pretya no iha', 'Anything done as sacrifice, charity or penance without faith in the Supreme, O son of Pṛthā, is impermanent. It is called asat and is useless both in this life and the next.'), -- 17.28
  ((select id from public.verse_citations where order_index = 99), 'yajña-dāna-tapaḥ-karma na tyājyaṁ kāryam eva tat yajño dānaṁ tapaś caiva pāvanāni manīṣiṇām', 'Acts of sacrifice, charity and penance are not to be given up; they must be performed. Indeed, sacrifice, charity and penance purify even the great souls.'), -- 18.5
  ((select id from public.verse_citations where order_index = 100), 'na hi deha-bhṛtā śakyaṁ tyaktuṁ karmāṇy aśeṣataḥ yas tu karma-phala-tyāgī sa tyāgīty abhidhīyate', 'It is indeed impossible for an embodied being to give up all activities. But he who renounces the fruits of action is called one who has truly renounced.'), -- 18.11
  ((select id from public.verse_citations where order_index = 101), 'sarva-bhūteṣu yenaikaṁ bhāvam avyayam īkṣate avibhaktaṁ vibhakteṣu taj jñānaṁ viddhi sāttvikam', 'That knowledge by which one undivided spiritual nature is seen in all living entities, though they are divided into innumerable forms, you should understand to be in the mode of goodness.'), -- 18.20
  ((select id from public.verse_citations where order_index = 102), 'śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt svabhāva-niyataṁ karma kurvan nāpnoti kilbiṣam', 'It is better to engage in one’s own occupation, even though one may perform it imperfectly, than to accept another’s occupation and perform it perfectly. Duties prescribed according to one’s nature are never affected by sinful reactions.'), -- 18.47
  ((select id from public.verse_citations where order_index = 103), 'brahma-bhūtaḥ prasannātmā na śocati na kāṅkṣati samaḥ sarveṣu bhūteṣu mad-bhaktiṁ labhate parām', 'One who is thus transcendentally situated at once realizes the Supreme Brahman and becomes fully joyful. He never laments or desires to have anything. He is equally disposed toward every living entity. In that state he attains pure devotional service unto Me.'), -- 18.54
  ((select id from public.verse_citations where order_index = 104), 'bhaktyā mām abhijānāti yāvān yaś cāsmi tattvataḥ tato māṁ tattvato jñātvā viśate tad-anantaram', 'One can understand Me as I am, as the Supreme Personality of Godhead, only by devotional service. And when one is in full consciousness of Me by such devotion, he can enter into the kingdom of God.'), -- 18.55
  ((select id from public.verse_citations where order_index = 105), 'īśvaraḥ sarva-bhūtānāṁ hṛd-deśe ’rjuna tiṣṭhati bhrāmayan sarva-bhūtāni yantrārūḍhāni māyayā', 'The Supreme Lord is situated in everyone’s heart, O Arjuna, and is directing the wanderings of all living entities, who are seated as on a machine, made of the material energy.'), -- 18.61
  ((select id from public.verse_citations where order_index = 106), 'tam eva śaraṇaṁ gaccha sarva-bhāvena bhārata tat-prasādāt parāṁ śāntiṁ sthānaṁ prāpsyasi śāśvatam', 'O scion of Bharata, surrender unto Him utterly. By His grace you will attain transcendental peace and the supreme and eternal abode.'), -- 18.62
  ((select id from public.verse_citations where order_index = 107), 'man-manā bhava mad-bhakto mad-yājī māṁ namaskuru mām evaiṣyasi satyaṁ te pratijāne priyo ’si me', 'Always think of Me, become My devotee, worship Me and offer your homage unto Me. Thus you will come to Me without fail. I promise you this because you are My very dear friend.'), -- 18.65
  ((select id from public.verse_citations where order_index = 108), 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja ahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ', 'Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.') -- 18.66
on conflict (verse_citation_id) do nothing;

commit;
