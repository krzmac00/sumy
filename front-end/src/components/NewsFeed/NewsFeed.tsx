import React from 'react';
import NewsFeedList from '../news/NewsFeedList';
import './NewsFeed.css';

const NewsFeed: React.FC = () => {
  return (
    <div className="news-feed">
      <NewsFeedList />
    </div>
  );
};

export default NewsFeed;