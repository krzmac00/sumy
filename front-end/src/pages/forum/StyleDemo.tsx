import React from 'react';
import MainLayout from '../../layouts/MainLayout';
import ThreadCardTest from '../../components/forum/ThreadCardTest';

const StyleDemo: React.FC = () => {
  
  return (
    <MainLayout>
      <div className="style-demo-page">
        <ThreadCardTest />
        
        <div style={{ margin: '40px 0', padding: '20px', backgroundColor: '#f2f2f2', borderRadius: '4px' }}>
          <h2 style={{ color: '#8b0002', marginBottom: '10px' }}>Implementation Details</h2>
          <ul style={{ lineHeight: '1.6' }}>
            <li>Thread cards with upvote/downvote functionality</li>
            <li>Time formatting according to requirements (minutes/hours/days/weeks/months/years ago)</li>
            <li>Internationalization support for EN and PL languages</li>
            <li>Color palette using variations of #8b0002, black, and white</li>
            <li>User profile pictures using the default image at @front-endpublic/user_default_image.png</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default StyleDemo;