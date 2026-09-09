-- Add a Test Family Member
-- This adds sample data for another family member so you can test SMS features
--
-- INSTRUCTIONS:
-- 1. Have someone sign up with a test email (like sarah.test@example.com)
-- 2. Get their user ID from the users table
-- 3. Update the MEMBER_ID below with their actual UUID
-- 4. Run this script to populate their profile with test data

DO $$
DECLARE
  -- CHANGE THIS to the new member's user ID from auth
  member_id uuid := 'PASTE_MEMBER_UUID_HERE'::uuid;

  your_family_id uuid;
BEGIN
  -- Get your family ID
  SELECT family_id INTO your_family_id
  FROM users
  WHERE id = auth.uid();

  IF your_family_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a family yet. Run test-family-simple.sql first.';
  END IF;

  -- Update the member's profile with test data
  UPDATE users
  SET
    family_id = your_family_id,
    phone_number = '(555) 234-5678',
    location = 'Austin, TX',
    occupation = 'Graphic Designer',
    birthday = '1992-03-15',
    bio = 'Love hiking and trying new coffee shops! Always down for an adventure.'
  WHERE id = member_id;

  -- Add interests for this member
  INSERT INTO interest_cards (user_id, category, is_custom, description, created_at)
  VALUES
    (member_id, 'art', false, 'I love exploring galleries and creating digital art in my free time', NOW() - INTERVAL '15 days'),
    (member_id, 'hiking', false, 'Weekend warrior! Always looking for new trails to explore', NOW() - INTERVAL '15 days'),
    (member_id, 'coffee', true, 'Coffee snob and proud of it. Know all the best local spots.', NOW() - INTERVAL '10 days');

  -- Add picks for this member
  INSERT INTO picks (user_id, category, value, interest_tag, created_at)
  VALUES
    (member_id, 'movie', 'Everything Everywhere All At Once', 'movies', NOW() - INTERVAL '10 days'),
    (member_id, 'food', 'Tacos al Pastor', NULL, NOW() - INTERVAL '10 days'),
    (member_id, 'song', 'Levitating - Dua Lipa', 'music', NOW() - INTERVAL '5 days'),
    (member_id, 'book', 'The Midnight Library', 'books', NOW() - INTERVAL '3 hours'), -- Recent!
    (member_id, 'place', 'Big Sur Coastline', 'hiking', NOW() - INTERVAL '10 days'),
    (member_id, 'restaurant', 'La Condesa', NULL, NOW() - INTERVAL '10 days');

  -- Add some activities for this member
  INSERT INTO activities (user_id, title, description, starts_at, location_name, notes, created_at)
  VALUES
    (
      member_id,
      'Art Gallery Opening',
      'Check out the new modern art exhibit downtown',
      NOW() + INTERVAL '3 days' + INTERVAL '19 hours',
      'Downtown Gallery',
      'Free drinks and snacks! Text me if you want to carpool.',
      NOW() - INTERVAL '2 hours'
    ),
    (
      member_id,
      'Weekend Hike',
      'Planning a morning hike at the state park',
      NOW() + INTERVAL '5 days' + INTERVAL '9 hours',
      'Eagle Peak Trail',
      'Moderate difficulty, about 6 miles. Bring water and snacks!',
      NOW() - INTERVAL '5 hours'
    ),
    (
      member_id,
      'Birthday Party',
      'Celebrating my birthday with dinner and karaoke!',
      NOW() + INTERVAL '12 days' + INTERVAL '19 hours',
      'Tokyo Karaoke Bar',
      'RSVP so I know how many to expect. See you there!',
      NOW() - INTERVAL '3 days'
    );

  RAISE NOTICE '✅ Test member added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Member Details:';
  RAISE NOTICE '   Member ID: %', member_id;
  RAISE NOTICE '   Family ID: %', your_family_id;
  RAISE NOTICE '';
  RAISE NOTICE '📦 Created for this member:';
  RAISE NOTICE '   • Profile with phone number: (555) 234-5678';
  RAISE NOTICE '   • 3 interest cards';
  RAISE NOTICE '   • 6 picks (1 recent)';
  RAISE NOTICE '   • 3 activities';
  RAISE NOTICE '';
  RAISE NOTICE '✨ You can now test the "Text" buttons with this member!';

END $$;
