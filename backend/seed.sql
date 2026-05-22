INSERT INTO quests (title, description, duration, distance, difficulty, price, currency, locations_count, questions_count, transport_cost, start_point, end_point, status, rating, steps)
VALUES (
  'Victoria Harbour Discovery',
  'Explore the iconic Victoria Harbour and surrounding historic landmarks of Hong Kong. A fascinating walking tour through the heart of the city.',
  '2-3 hours',
  '4.5 km',
  'Легко',
  120,
  'HK$',
  6,
  4,
  'MTR: Tsim Sha Tsui Station',
  'Tsim Sha Tsui Promenade',
  'Central Pier',
  'published',
  4.8,
  '[
    {"type":"navigation","title":"Start at Tsim Sha Tsui Promenade","content":"Head to the famous waterfront promenade with stunning views of Victoria Harbour and Hong Kong Island skyline.","location":{"lat":22.2934,"lng":114.1722,"address":"Tsim Sha Tsui Promenade, Kowloon"},"order":1},
    {"type":"info","title":"Avenue of Stars","content":"Walk along the Avenue of Stars, Hong Kong version of the Hollywood Walk of Fame, celebrating the Hong Kong film industry.","order":2},
    {"type":"question","title":"Who is the most famous Hong Kong actor?","options":["Jackie Chan","Bruce Lee","Chow Yun-fat","Tony Leung"],"answer":"Bruce Lee","order":3},
    {"type":"navigation","title":"Clock Tower","content":"Visit the historic Clock Tower, the only remaining structure of the old Kowloon-Canton Railway terminus built in 1915.","location":{"lat":22.2951,"lng":114.1689,"address":"Clock Tower, Tsim Sha Tsui"},"order":4},
    {"type":"question","title":"In what year was the Clock Tower built?","options":["1910","1915","1920","1925"],"answer":"1915","order":5},
    {"type":"navigation","title":"Take the Star Ferry to Central","content":"Board the iconic Star Ferry for a 10-minute ride across Victoria Harbour - one of the worlds great harbour crossings.","location":{"lat":22.2937,"lng":114.1678,"address":"Star Ferry Pier, Tsim Sha Tsui"},"order":6}
  ]'::jsonb
);
