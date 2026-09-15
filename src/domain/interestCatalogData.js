// Large seed catalog. The database remains the source of truth after seeding.
export const CATEGORIES = [
  ['technology','Technology','💻'],['gaming','Gaming','🎮'],['music','Music','🎵'],['creative','Creative','🎨'],['education','Education','📚'],
  ['sports','Sports','🏀'],['business','Business','🚀'],['travel','Travel','✈️'],['entertainment','Entertainment','🎬'],['science','Science','🔬'],
  ['lifestyle','Lifestyle','🍳'],['nature','Nature','🌱'],['books','Books','📖'],['food','Food','🍔'],['pets','Pets','🐾'],
  ['fashion','Fashion','👗'],['photography','Photography','📷'],['creator','Creators','🎥'],['crypto','Crypto & Web3','🪙'],['culture','Culture','🌍'],
  ['social','Social & Community','🤝'],['automotive','Cars & Motors','🚗'],['fitness','Fitness','🏋️'],['anime_manga','Anime & Manga','🍥'],
].map(([id,name,emoji], i) => ({ id, name, emoji, sort_order:i+1 }));

const groups = {
  technology:[['ai','AI','🤖'],['programming','Programming','💻'],['web_dev','Web Development','🌐'],['mobile_dev','Mobile Development','📱'],['cybersecurity','Cybersecurity','🛡️'],['gadgets','Gadgets','📱'],['cloud','Cloud','☁️'],['data_science','Data Science','📊']],
  gaming:[['gaming_general','Gaming','🎮'],['esports','Esports','🏆'],['game_dev','Game Development','🕹️'],['playstation','PlayStation','🎮'],['xbox','Xbox','🟩'],['pc_gaming','PC Gaming','🖥️'],['mobile_gaming','Mobile Gaming','📲'],['minecraft','Minecraft','⛏️']],
  music:[['afrobeats','Afrobeats','🎵'],['hiphop','Hip-Hop','🎤'],['production','Music Production','🎧'],['amapiano','Amapiano','🎹'],['rnb','R&B','🎶'],['pop','Pop','🎤'],['gospel_music','Gospel Music','🎼'],['djing','DJing','🎛️']],
  creative:[['design','Design','🎨'],['illustration','Illustration','🖌️'],['writing','Writing','✍️'],['poetry','Poetry','📝'],['animation','Animation','✨'],['crafts','Crafts','🧵'],['film_making','Filmmaking','🎞️'],['storytelling','Storytelling','📜']],
  education:[['ai_agents','AI Agents','🤖'],['self_learning','Self Learning','📚'],['languages_learning','Language Learning','🗣️'],['mathematics','Mathematics','➗'],['history','History','🏛️'],['psychology','Psychology','🧠'],['coding_learning','Coding','👨‍💻'],['study_buddies','Study Buddies','📒']],
  sports:[['football','Football','⚽'],['basketball','Basketball','🏀'],['tennis','Tennis','🎾'],['boxing','Boxing','🥊'],['mma','MMA','🥋'],['athletics','Athletics','🏃'],['cycling','Cycling','🚴'],['swimming','Swimming','🏊']],
  business:[['startups','Startups','🚀'],['networking','Networking','🤝'],['investing','Investing','📈'],['entrepreneurship','Entrepreneurship','💼'],['marketing','Marketing','📣'],['sales','Sales','💰'],['freelancing','Freelancing','💻'],['leadership','Leadership','👑']],
  travel:[['travel_general','Travel','✈️'],['backpacking','Backpacking','🎒'],['beaches','Beaches','🏖️'],['road_trips','Road Trips','🚙'],['phototourism','Photo Travel','📷'],['city_breaks','City Breaks','🏙️'],['adventure_travel','Adventure Travel','🧗'],['local_exploring','Local Exploring','🗺️']],
  entertainment:[['movies','Movies','🎬'],['series','TV Series','📺'],['comedy','Comedy','😂'],['podcasts','Podcasts','🎙️'],['celebrity_news','Celebrity News','⭐'],['reality_tv','Reality TV','📺'],['documentaries','Documentaries','🎥'],['memes','Memes','🤣']],
  science:[['space','Space','🪐'],['biology','Biology','🧬'],['robotics','Robotics','🦾'],['physics','Physics','⚛️'],['chemistry','Chemistry','🧪'],['astronomy','Astronomy','🔭'],['environmental_science','Environmental Science','🌎'],['innovation','Innovation','💡']],
  lifestyle:[['cooking','Cooking','🍳'],['home_decor','Home Decor','🏠'],['self_care','Self Care','🧴'],['coffee','Coffee','☕'],['personal_growth','Personal Growth','🌟'],['minimalism','Minimalism','◻️'],['productivity','Productivity','⏱️'],['fashion_lifestyle','Lifestyle Fashion','👕']],
  nature:[['hiking','Hiking','🥾'],['sustainability','Sustainability','🌱'],['camping','Camping','⛺'],['gardening','Gardening','🌿'],['wildlife','Wildlife','🦁'],['fishing','Fishing','🎣'],['birdwatching','Birdwatching','🦜'],['nature_photography','Nature Photography','🌄']],
  books:[['fiction','Fiction','📚'],['nonfiction','Non-fiction','📘'],['fantasy_books','Fantasy','🧙'],['romance_books','Romance','💗'],['business_books','Business Books','💼'],['self_help_books','Self-help','🌟'],['mystery_books','Mystery','🕵️'],['comics','Comics','💥']],
  food:[['foodies','Foodies','🍴'],['street_food','Street Food','🌮'],['baking','Baking','🧁'],['african_food','African Food','🍲'],['fast_food','Fast Food','🍔'],['healthy_food','Healthy Food','🥗'],['desserts','Desserts','🍰'],['restaurants','Restaurants','🍽️']],
  pets:[['dogs','Dogs','🐶'],['cats','Cats','🐱'],['birds_pets','Pet Birds','🦜'],['fish_pets','Aquariums','🐠'],['pet_care','Pet Care','🩷'],['animal_lovers','Animal Lovers','🐾']],
  fashion:[['streetwear','Streetwear','👟'],['sneakers','Sneakers','👟'],['beauty','Beauty','💄'],['mens_fashion','Men’s Fashion','🧥'],['womens_fashion','Women’s Fashion','👗'],['thrift','Thrift Fashion','🛍️'],['style','Personal Style','✨']],
  photography:[['portrait_photo','Portraits','🧑‍🎨'],['street_photo','Street Photography','🏙️'],['mobile_photo','Mobile Photography','📱'],['editing_photo','Photo Editing','🖼️'],['camera_gear','Camera Gear','📷'],['videography','Videography','🎥']],
  creator:[['youtube','YouTube','▶️'],['tiktok','TikTok','🎵'],['streaming','Streaming','📡'],['content_creation','Content Creation','🎬'],['blogging','Blogging','📰'],['social_media','Social Media','📱'],['personal_brand','Personal Brand','⭐']],
  crypto:[['crypto_general','Crypto','🪙'],['bitcoin','Bitcoin','₿'],['ethereum','Ethereum','♦️'],['web3','Web3','🌐'],['defi','DeFi','💸'],['nfts','NFTs','🖼️'],['blockchain','Blockchain','⛓️']],
  culture:[['african_culture','African Culture','🌍'],['nollywood','Nollywood','🎬'],['languages_culture','Languages & Culture','🗣️'],['fashion_culture','Cultural Fashion','🧵'],['music_culture','Music Culture','🎶'],['local_history','Local History','🏛️']],
  social:[['community','Community','🤝'],['volunteering','Volunteering','❤️'],['events','Events','🎟️'],['meetups','Meetups','📍'],['online_communities','Online Communities','🌐'],['friendship','Friendship','🫶']],
  automotive:[['cars','Cars','🚗'],['supercars','Supercars','🏎️'],['motorsport','Motorsport','🏁'],['motorcycles','Motorcycles','🏍️'],['car_mods','Car Mods','🔧'],['electric_cars','Electric Cars','⚡']],
  fitness:[['gym','Gym','🏋️'],['running','Running','🏃'],['home_workouts','Home Workouts','🏠'],['bodybuilding','Bodybuilding','💪'],['yoga','Yoga','🧘'],['calisthenics','Calisthenics','🤸'],['wellness','Wellness','🌿']],
  anime_manga:[['anime','Anime','🍥'],['manga','Manga','📖'],['manhwa','Manhwa','📚'],['cosplay','Cosplay','🎭'],['one_piece','One Piece','🏴‍☠️'],['naruto','Naruto','🍥'],['dragon_ball','Dragon Ball','🐉'],['demon_slayer','Demon Slayer','⚔️']],
};

export const INTERESTS = Object.entries(groups).flatMap(([category_id, items]) => items.map(([id,name,emoji]) => ({ id, name, emoji, category_id })));
