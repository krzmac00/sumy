import React from 'react';
import { Thread } from '../../types/forum';
import RedditThreadCard from './RedditThreadCard';

// Test component to display multiple threads with different timestamps
const RedditThreadCardTest: React.FC = () => {
  // Current date to calculate relative dates
  const now = new Date();
  
  // Helper function to create a date in the past
  const getDateBefore = (minutes = 0, hours = 0, days = 0, months = 0, years = 0): string => {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - minutes);
    date.setHours(date.getHours() - hours);
    date.setDate(date.getDate() - days);
    date.setMonth(date.getMonth() - months);
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString();
  };

  // Create sample threads with different timestamps
  const testThreads: Thread[] = [
    // Minutes ago
    {
      post: 1,
      category: 'programming',
      title: 'Post from 15 minutes ago',
      visible_for_teachers: false,
      can_be_answered: true,
      last_activity_date: getDateBefore(15),
      nickname: 'recent_user',
      content: 'This post was created just 15 minutes ago to test the relative time formatting.',
      posts: [],
      is_anonymous: false,
      author_display_name: 'Recent User'
    },
    // Hours ago
    {
      post: 2,
      category: 'design',
      title: 'Post from 3 hours ago',
      visible_for_teachers: false,
      can_be_answered: true,
      last_activity_date: getDateBefore(0, 3),
      nickname: 'hourly_poster',
      content: 'This post was created 3 hours ago to test the relative time formatting.',
      posts: [{ id: 101, nickname: 'commenter', content: 'Nice post!', date: getDateBefore(30), was_edited: false, thread: 2, replying_to: [], is_anonymous: false, user_display_name: 'Commenter' }],
      is_anonymous: false,
      author_display_name: 'Hourly Poster'
    },
    // Days ago
    {
      post: 3,
      category: 'news',
      title: 'Post from 2 days ago',
      visible_for_teachers: true,
      can_be_answered: true,
      last_activity_date: getDateBefore(0, 0, 2),
      nickname: 'daily_news',
      content: 'This post was created 2 days ago to test the relative time formatting.',
      posts: [
        { id: 102, nickname: 'reader1', content: 'Interesting!', date: getDateBefore(0, 12), was_edited: false, thread: 3, replying_to: [], is_anonymous: false, user_display_name: 'Reader One' },
        { id: 103, nickname: 'reader2', content: 'Thanks for sharing!', date: getDateBefore(0, 6), was_edited: false, thread: 3, replying_to: [], is_anonymous: true, user_display_name: 'Anonymous' }
      ],
      is_anonymous: false,
      author_display_name: 'Daily News'
    },
    // Weeks ago
    {
      post: 4,
      category: 'help',
      title: 'Post from 2 weeks ago',
      visible_for_teachers: false,
      can_be_answered: true, 
      last_activity_date: getDateBefore(0, 0, 14),
      nickname: 'weekly_helper',
      content: 'This post was created 2 weeks ago to test the relative time formatting.',
      posts: [],
      is_anonymous: true,
      author_display_name: 'Anonymous'
    },
    // Months ago
    {
      post: 5,
      category: 'general',
      title: 'Post from 3 months ago',
      visible_for_teachers: false,
      can_be_answered: true,
      last_activity_date: getDateBefore(0, 0, 0, 3),
      nickname: 'monthly_poster',
      content: 'This post was created 3 months ago to test the relative time formatting.',
      posts: [{ id: 104, nickname: 'latereply', content: 'Still relevant!', date: getDateBefore(0, 0, 5), was_edited: true, thread: 5, replying_to: [], is_anonymous: false, user_display_name: 'Late Reply' }],
      is_anonymous: false,
      author_display_name: 'Monthly Poster'
    },
    // Years ago
    {
      post: 6,
      category: 'archive',
      title: 'Post from 2 years ago',
      visible_for_teachers: false,
      can_be_answered: false,
      last_activity_date: getDateBefore(0, 0, 0, 0, 2),
      nickname: 'veteran_user',
      content: 'This post was created 2 years ago to test the relative time formatting.',
      posts: [
        { id: 105, nickname: 'historian', content: 'Classic thread!', date: getDateBefore(0, 0, 0, 6), was_edited: false, thread: 6, replying_to: [], is_anonymous: false, user_display_name: 'Historian' },
        { id: 106, nickname: 'newbie', content: "I'm new here, just found this thread!", date: getDateBefore(0, 0, 7), was_edited: false, thread: 6, replying_to: [], is_anonymous: false, user_display_name: 'Newbie' }
      ],
      is_anonymous: false,
      author_display_name: 'Veteran User'
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#8b0002', marginBottom: '20px' }}>Reddit-Style Thread Cards</h1>
      <p style={{ marginBottom: '20px' }}>This page demonstrates Reddit-style thread cards with different timestamps:</p>
      
      <div>
        {testThreads.map(thread => (
          <RedditThreadCard key={thread.post} thread={thread} />
        ))}
      </div>
    </div>
  );
};

export default RedditThreadCardTest;