-- Complete Test Family Setup
-- This creates a separate test family with full data so you can test the entire app flow
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
  test_family_id uuid := gen_random_uuid();
  test_user_id uuid := gen_random_uuid(); -- This will be YOUR test account
  sarah_id uuid := gen_random_uuid();
  mike_id uuid := gen_random_uuid();
  emma_id uuid := gen_random_uuid();
  alex_id uuid := gen_random_uuid();
BEGIN
  -- Create the test family
  INSERT INTO families (id, name, invite_code, created_at)
  VALUES (
    test_family_id,
    'Test Family',
    'TEST' || floor(random() * 10000)::text,
    NOW()
  );

  -- Create YOUR test user account (you'll log in as this)
  INSERT INTO users (id, name, family_id, phone_number, location, occupation, bio, created_at)
  VALUES (
    test_user_id,
    'Test User (You)',
    test_family_id,
    '(555) 100-0000',
    'San Francisco, CA',
    'Product Designer',
    'Testing out this awesome family app!',
    NOW() - INTERVAL '60 days'
  );

  -- Create test family members with full profiles
  INSERT INTO users (id, name, family_id, phone_number, location, occupation, birthday, bio, created_at)
  VALUES
    (
      sarah_id,
      'Sarah Rodriguez',
      test_family_id,
      '(555) 234-5678',
      'Austin, TX',
      'Graphic Designer',
      '1992-03-15',
      'Love hiking and trying new coffee shops! Always down for an adventure.',
      NOW() - INTERVAL '30 days'
    ),
    (
      mike_id,
      'Mike Chen',
      test_family_id,
      '(555) 345-6789',
      'Portland, OR',
      'Software Engineer',
      '1988-07-22',
      'Coding by day, rock climbing by night. Let me know if you want to grab lunch!',
      NOW() - INTERVAL '25 days'
    ),
    (
      emma_id,
      'Emma Williams',
      test_family_id,
      '(555) 456-7890',
      'Seattle, WA',
      'Teacher',
      '1995-11-08',
      'Elementary school teacher who loves reading and baking. Feel free to text anytime!',
      NOW() - INTERVAL '20 days'
    ),
    (
      alex_id,
      'Alex Johnson',
      test_family_id,
      '(555) 567-8901',
      'Denver, CO',
      'Photographer',
      '1990-05-30',
      'Landscape photographer and coffee enthusiast. Always chasing the perfect sunset.',
      NOW() - INTERVAL '15 days'
    );

  -- Add some test activities from different family members
  INSERT INTO activities (user_id, title, description, starts_at, location_name, notes, created_at)
  VALUES
    (
      sarah_id,
      'Art Gallery Opening',
      'Check out the new modern art exhibit downtown',
      NOW() + INTERVAL '3 days' + INTERVAL '19 hours',
      'Downtown Gallery',
      'Free drinks and snacks! Text me if you want to carpool.',
      NOW() - INTERVAL '2 hours'
    ),
    (
      mike_id,
      'Weekend Hike',
      'Planning a morning hike at the state park',
      NOW() + INTERVAL '5 days' + INTERVAL '9 hours',
      'Eagle Peak Trail',
      'Moderate difficulty, about 6 miles. Bring water and snacks!',
      NOW() - INTERVAL '5 hours'
    ),
    (
      emma_id,
      'Book Club Meeting',
      'Discussing "Project Hail Mary" this month',
      NOW() + INTERVAL '7 days' + INTERVAL '18 hours',
      'Cozy Café',
      'Join us even if you haven''t finished! Coffee on me.',
      NOW() - INTERVAL '1 day'
    ),
    (
      sarah_id,
      'Birthday Party',
      'Celebrating my birthday with dinner and karaoke!',
      NOW() + INTERVAL '12 days' + INTERVAL '19 hours',
      'Tokyo Karaoke Bar',
      'RSVP so I know how many to expect. See you there!',
      NOW() - INTERVAL '3 days'
    ),
    (
      alex_id,
      'Photography Workshop',
      'Teaching basic landscape photography techniques',
      NOW() + INTERVAL '9 days' + INTERVAL '14 hours',
      'City Park',
      'Bring your camera! We''ll cover composition and lighting.',
      NOW() - INTERVAL '6 hours'
    ),
    (
      test_user_id,
      'Family Dinner',
      'Hosting everyone for Sunday dinner',
      NOW() + INTERVAL '2 days' + INTERVAL '18 hours',
      'My Place',
      'Cooking pasta! Let me know if you can make it.',
      NOW() - INTERVAL '4 hours'
    );

  -- Add interest cards for everyone
  INSERT INTO interest_cards (user_id, category, is_custom, description, created_at)
  VALUES
    -- Sarah's interests
    (sarah_id, 'art', false, 'I love exploring galleries and creating digital art in my free time', NOW() - INTERVAL '15 days'),
    (sarah_id, 'hiking', false, 'Weekend warrior! Always looking for new trails to explore', NOW() - INTERVAL '15 days'),
    (sarah_id, 'coffee', true, 'Coffee snob and proud of it. Know all the best local spots.', NOW() - INTERVAL '10 days'),

    -- Mike's interests
    (mike_id, 'tech', false, 'Full-stack developer who loves tinkering with new frameworks', NOW() - INTERVAL '12 days'),
    (mike_id, 'climbing', true, 'Indoor and outdoor climbing - it''s my main hobby!', NOW() - INTERVAL '12 days'),
    (mike_id, 'cooking', false, 'Love experimenting with Asian fusion recipes', NOW() - INTERVAL '8 days'),

    -- Emma's interests
    (emma_id, 'books', false, 'Always have 3-4 books going at once. Mostly sci-fi and mystery', NOW() - INTERVAL '10 days'),
    (emma_id, 'baking', true, 'Love trying new recipes - my cookies are legendary!', NOW() - INTERVAL '10 days'),
    (emma_id, 'teaching', true, 'Passionate about education and helping kids learn', NOW() - INTERVAL '5 days'),

    -- Alex's interests
    (alex_id, 'photography', false, 'Landscape and nature photography is my passion', NOW() - INTERVAL '8 days'),
    (alex_id, 'travel', false, 'Been to 15 national parks and counting!', NOW() - INTERVAL '8 days'),
    (alex_id, 'coffee', true, 'Coffee lover - always hunting for the perfect brew', NOW() - INTERVAL '3 days'),

    -- Test user's interests
    (test_user_id, 'music', false, 'Love discovering new indie artists and going to concerts', NOW() - INTERVAL '20 days'),
    (test_user_id, 'design', true, 'UI/UX design is both my job and my passion', NOW() - INTERVAL '20 days'),
    (test_user_id, 'fitness', false, 'Morning runner trying to stay consistent!', NOW() - INTERVAL '15 days');

  -- Add picks for everyone (including recent ones for feed testing)
  INSERT INTO picks (user_id, category, value, interest_tag, created_at)
  VALUES
    -- Sarah's picks
    (sarah_id, 'movie', 'Everything Everywhere All At Once', 'movies', NOW() - INTERVAL '10 days'),
    (sarah_id, 'food', 'Tacos al Pastor', NULL, NOW() - INTERVAL '10 days'),
    (sarah_id, 'song', 'Levitating - Dua Lipa', 'music', NOW() - INTERVAL '5 days'),
    (sarah_id, 'book', 'The Midnight Library', 'books', NOW() - INTERVAL '3 hours'), -- Recent!
    (sarah_id, 'place', 'Big Sur Coastline', 'hiking', NOW() - INTERVAL '10 days'),
    (sarah_id, 'restaurant', 'La Condesa', NULL, NOW() - INTERVAL '10 days'),

    -- Mike's picks
    (mike_id, 'movie', 'Blade Runner 2049', 'movies', NOW() - INTERVAL '8 days'),
    (mike_id, 'food', 'Ramen', NULL, NOW() - INTERVAL '8 days'),
    (mike_id, 'song', 'Mr. Blue Sky', 'music', NOW() - INTERVAL '8 days'),
    (mike_id, 'book', 'The Pragmatic Programmer', 'tech', NOW() - INTERVAL '8 days'),
    (mike_id, 'place', 'Smith Rock State Park', 'climbing', NOW() - INTERVAL '2 hours'), -- Recent!
    (mike_id, 'restaurant', 'Pok Pok', NULL, NOW() - INTERVAL '1 hour'), -- Recent!

    -- Emma's picks
    (emma_id, 'movie', 'Arrival', 'movies', NOW() - INTERVAL '6 days'),
    (emma_id, 'food', 'Chocolate Chip Cookies', 'baking', NOW() - INTERVAL '6 days'),
    (emma_id, 'song', 'Vienna - Billy Joel', 'music', NOW() - INTERVAL '6 days'),
    (emma_id, 'book', 'Project Hail Mary', 'books', NOW() - INTERVAL '6 days'),
    (emma_id, 'place', 'Seattle Public Library', NULL, NOW() - INTERVAL '5 hours'), -- Recent!
    (emma_id, 'restaurant', 'That Little French Bistro', NULL, NOW() - INTERVAL '6 days'),

    -- Alex's picks
    (alex_id, 'movie', 'The Secret Life of Walter Mitty', 'travel', NOW() - INTERVAL '4 days'),
    (alex_id, 'food', 'Green Curry', NULL, NOW() - INTERVAL '4 days'),
    (alex_id, 'song', 'Holocene - Bon Iver', 'music', NOW() - INTERVAL '4 days'),
    (alex_id, 'book', 'A Walk in the Woods', 'travel', NOW() - INTERVAL '8 hours'), -- Recent!
    (alex_id, 'place', 'Maroon Bells', 'photography', NOW() - INTERVAL '4 days'),
    (alex_id, 'restaurant', 'Mountain Sun Pub', NULL, NOW() - INTERVAL '4 days'),

    -- Test user's picks
    (test_user_id, 'movie', 'The Social Network', 'design', NOW() - INTERVAL '15 days'),
    (test_user_id, 'food', 'Sushi', NULL, NOW() - INTERVAL '15 days'),
    (test_user_id, 'song', 'Good News - Mac Miller', 'music', NOW() - INTERVAL '15 days'),
    (test_user_id, 'book', 'Don''t Make Me Think', 'design', NOW() - INTERVAL '15 days'),
    (test_user_id, 'place', 'Golden Gate Park', 'fitness', NOW() - INTERVAL '10 hours'), -- Recent!
    (test_user_id, 'restaurant', 'Tartine Bakery', NULL, NOW() - INTERVAL '15 days');

  RAISE NOTICE '✅ Test family created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Test Family Details:';
  RAISE NOTICE '   Family ID: %', test_family_id;
  RAISE NOTICE '   Invite Code: TEST%', floor(random() * 10000)::text;
  RAISE NOTICE '';
  RAISE NOTICE '👤 Your Test User ID: %', test_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '1. Sign up at your app with a NEW test email';
  RAISE NOTICE '2. After signup completes, run this SQL to link your auth account:';
  RAISE NOTICE '';
  RAISE NOTICE '   UPDATE users SET id = auth.uid() WHERE id = ''%'';', test_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '3. Refresh your app and you''ll see the full test family!';
  RAISE NOTICE '';
  RAISE NOTICE '📦 What''s included:';
  RAISE NOTICE '   • 5 family members (You + Sarah + Mike + Emma + Alex)';
  RAISE NOTICE '   • 6 activities with dates, locations, and phone numbers';
  RAISE NOTICE '   • 15 interest cards across all members';
  RAISE NOTICE '   • 30 picks (6 recent ones for testing the feed filter)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test these features:';
  RAISE NOTICE '   • Feed filtering (All/Activities/Picks)';
  RAISE NOTICE '   • "Text [Name]" buttons on activities and profiles';
  RAISE NOTICE '   • Family member profiles with interests & picks';
  RAISE NOTICE '   • Calendar with multiple events';
  RAISE NOTICE '   • Trading card design for interests and picks';

END $$;
