-- Simplified Test Family Setup
-- This approach works around the auth.users foreign key constraint
--
-- INSTRUCTIONS:
-- 1. First, sign up at your app with a test email to create your auth account
-- 2. Get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-test-email@example.com';
-- 3. Paste your user ID below where it says 'PASTE_YOUR_USER_ID_HERE'
-- 4. Run this script - it will create a test family and add you to it

DO $$
DECLARE
  test_family_id uuid := gen_random_uuid();
  -- CHANGE THIS: Paste your user ID from step 2
  your_user_id uuid := 'e5b30988-3b9f-4f4f-98b8-a0719c02ac35'::uuid;
BEGIN

  -- Create the test family
  INSERT INTO families (id, name, invite_code, created_at)
  VALUES (
    test_family_id,
    'Test Family',
    'TEST' || floor(random() * 10000)::text,
    NOW()
  );

  -- Update YOUR user to join the test family and add profile data
  UPDATE users
  SET
    family_id = test_family_id,
    phone_number = '(555) 100-0000',
    location = 'San Francisco, CA',
    occupation = 'Product Designer',
    bio = 'Testing out this awesome family app!'
  WHERE id = your_user_id;

  -- Add some interests for you
  INSERT INTO interest_cards (user_id, category, is_custom, description, tags, created_at)
  VALUES
    (your_user_id, 'music', false, 'Love discovering new indie artists and going to concerts', ARRAY['Indie', 'Alternative', 'Live Shows'], NOW() - INTERVAL '20 days'),
    (your_user_id, 'design', true, 'UI/UX design is both my job and my passion', ARRAY['Figma', 'Product Design', 'User Research'], NOW() - INTERVAL '20 days'),
    (your_user_id, 'fitness', false, 'Morning runner trying to stay consistent!', ARRAY['Running', 'Marathon Training'], NOW() - INTERVAL '15 days');

  -- Add some picks for you
  INSERT INTO picks (user_id, category, value, interest_tag, created_at)
  VALUES
    (your_user_id, 'movie', 'The Social Network', 'design', NOW() - INTERVAL '15 days'),
    (your_user_id, 'food', 'Sushi', NULL, NOW() - INTERVAL '15 days'),
    (your_user_id, 'song', 'Good News - Mac Miller', 'music', NOW() - INTERVAL '15 days'),
    (your_user_id, 'book', 'Don''t Make Me Think', 'design', NOW() - INTERVAL '15 days'),
    (your_user_id, 'place', 'Golden Gate Park', 'fitness', NOW() - INTERVAL '2 hours'), -- Recent!
    (your_user_id, 'restaurant', 'Tartine Bakery', NULL, NOW() - INTERVAL '15 days');

  -- Add some activities for you
  INSERT INTO activities (user_id, title, description, starts_at, location_name, notes, created_at)
  VALUES
    (
      your_user_id,
      'Family Dinner',
      'Hosting everyone for Sunday dinner',
      NOW() + INTERVAL '2 days' + INTERVAL '18 hours',
      'My Place',
      'Cooking pasta! Let me know if you can make it.',
      NOW() - INTERVAL '4 hours'
    ),
    (
      your_user_id,
      'Coffee Meetup',
      'Trying that new coffee shop downtown',
      NOW() + INTERVAL '5 days' + INTERVAL '10 hours',
      'Blue Bottle Coffee',
      'Text me if you want to join!',
      NOW() - INTERVAL '1 day'
    ),
    (
      your_user_id,
      'Design Workshop',
      'Hosting a Figma workshop for beginners',
      NOW() + INTERVAL '8 days' + INTERVAL '14 hours',
      'Online - Zoom',
      'Link will be shared closer to date.',
      NOW() - INTERVAL '2 days'
    );

  RAISE NOTICE '✅ Test family setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Details:';
  RAISE NOTICE '   Your User ID: %', your_user_id;
  RAISE NOTICE '   Family ID: %', test_family_id;
  RAISE NOTICE '';
  RAISE NOTICE '📦 Created for you:';
  RAISE NOTICE '   • Test Family with invite code';
  RAISE NOTICE '   • 3 interest cards';
  RAISE NOTICE '   • 6 picks (1 recent for feed testing)';
  RAISE NOTICE '   • 3 activities with dates';
  RAISE NOTICE '';
  RAISE NOTICE '👥 To add more family members:';
  RAISE NOTICE '   Have them sign up and use the family invite code,';
  RAISE NOTICE '   OR manually run the add-test-member.sql script';

END $$;
