import React from 'react';
import './index.css';

const TopBar = ({ userInfo }) => {
  return (
    <div className="top-bar">
      <div className="top-bar-content">
        <div className="avatar-section">
          <img 
            src={userInfo?.avatar_url || '/default-avatar.png'} 
            alt="User Avatar" 
            className="user-avatar"
          />
          <div className="user-text">
            <div className="greeting">Hi! {userInfo?.en_name || 'User'}</div>
            <div className="welcome">Welcome to Inside Advisory</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;