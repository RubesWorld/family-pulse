-- Test Data for SMS Feature
-- Run this in your Supabase SQL Editor to add test family members with phone numbers

-- First, let's get your family_id and user_id
-- You'll need to replace these with your actual values after running the queries below

-- Step 1: Find your family_id
-- SELECT family_id FROM users WHERE email = 'your-email@example.com';

-- Step 2: Replace 'YOUR_FAMILY_ID_HERE' below with the actual family_id from Step 1

DO $$
DECLARE
  test_family_id uuid := 'YOUR_FAMILY_ID_HERE'::uuid; -- REPLACE THIS!
  sarah_id uuid := gen_random_uuid();
  mike_id uuid := gen_random_uuid();
  emma_id uuid := gen_random_uuid();
BEGIN
  -- Insert test family members
  INSERT INTO users (id, name, email, family_id, phone_number, location, occupation, bio, created_at)
  VALUES
    (
      sarah_id,
      'Sarah Rodriguez',
      'sarah.test@example.com',
      test_family_id,
      '(555) 234-5678',
      'Austin, TX',
      'Graphic Designer',
      'Love hiking and trying new coffee shops! Always down for an adventure.',
      NOW() - INTERVAL '30 days'
    ),
    (
      mike_id,
      'Mike Chen',
      'mike.test@example.com',
      test_family_id,
      '(555) 345-6789',
      'Portland, OR',
      'Software Engineer',
      'Coding by day, rock climbing by night. Let me know if you want to grab lunch!',
      NOW() - INTERVAL '25 days'
    ),
    (
      emma_id,
      'Emma Williams',
      'emma.test@example.com',
      test_family_id,
      '(555) 456-7890',
      'Seattle, WA',
      'Teacher',
      'Elementary school teacher who loves reading and baking. Feel free to text anytime!',
      NOW() - INTERVAL '20 days'
    );

  -- Add some test activities
  INSERT INTO activities (user_id, title, description, starts_at, location_name, notes, created_at)
  VALUES
    (
      sarah_id,
      'Art Gallery Opening',
      'Check out the new modern art exhibit downtown',
      NOW() + INTERVAL '3 days',
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
    );

  -- Add some interests for variety
  INSERT INTO interest_cards (user_id, category, is_custom, description, created_at)
  VALUES
    (sarah_id, 'art', false, 'I love exploring galleries and creating digital art in my free time', NOW()),
    (sarah_id, 'hiking', false, 'Weekend warrior! Always looking for new trails to explore', NOW()),
    (mike_id, 'tech', false, 'Full-stack developer who loves tinkering with new frameworks', NOW()),
    (mike_id, 'climbing', true, 'Indoor and outdoor climbing - it''s my main hobby!', NOW()),
    (emma_id, 'books', false, 'Always have 3-4 books going at once. Mostly sci-fi and mystery', NOW()),
    (emma_id, 'baking', true, 'Love trying new recipes - my cookies are legendary!', NOW());

  -- Add some picks
  INSERT INTO picks (user_id, category, value, interest_tag, created_at)
  VALUES
    (sarah_id, 'movie', 'Everything Everywhere All At Once', 'movies', NOW()),
    (sarah_id, 'food', 'Tacos al Pastor', NULL, NOW()),
    (mike_id, 'song', 'Mr. Blue Sky', 'music', NOW()),
    (mike_id, 'place', 'Smith Rock State Park', NULL, NOW()),
    (emma_id, 'book', 'Project Hail Mary', 'books', NOW()),
    (emma_id, 'restaurant', 'That Little French Bistro', NULL, NOW());

END $$;

-- Done! Now refresh your app and you should see:
-- 1. Three new family members in the Family tab
-- 2. Four activities in the feed with "Text [Name]" buttons
-- 3. Each member's profile has a "Text" button
-- 4. Members have interests and picks you can browse
