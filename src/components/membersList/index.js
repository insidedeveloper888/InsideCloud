import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import clientConfig from '../../config/client_config.js';
import './index.css';

const MembersList = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getOrigin = (apiPort) => {
        const configuredOrigin = clientConfig.apiOrigin;
        if (configuredOrigin && configuredOrigin.length > 0) {
            return configuredOrigin;
        }
        // Default: use same-origin so CRA proxy can forward /api to localhost:8989
        return window.location.origin;
    };

    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(
                `${getOrigin(clientConfig.apiPort)}${clientConfig.getOrganizationMembersPath}`,
                { 
                    withCredentials: true, 
                    headers: { 'ngrok-skip-browser-warning': 'true' } 
                }
            );

            if (response.data && response.data.code === 0) {
                setMembers(response.data.data || []);
            } else {
                throw new Error(response.data?.msg || 'Failed to fetch members');
            }
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleRefresh = () => {
        fetchMembers();
    };

    if (loading) {
        return (
            <div className="members-list">
                <div className="members-header">
                    <h3>Organization Members</h3>
                </div>
                <div className="loading">Loading members...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="members-list">
                <div className="members-header">
                    <h3>Organization Members</h3>
                    <button onClick={handleRefresh} className="refresh-btn">Retry</button>
                </div>
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="members-list">
            <div className="members-header">
                <h3>Organization Members ({members.length})</h3>
                <button onClick={handleRefresh} className="refresh-btn">Refresh</button>
            </div>
            
            <div className="members-grid">
                {members.map((member) => (
                    <div key={member.user_id} className="member-card">
                        <div className="member-avatar">
                            {member.avatar_url ? (
                                <img 
                                    src={member.avatar_url} 
                                    alt={member.name || member.en_name}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className="avatar-placeholder" style={{display: member.avatar_url ? 'none' : 'flex'}}>
                                {(member.name || member.en_name || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="member-info">
                            <div className="member-name">
                                {member.name || member.en_name || 'Unknown User'}
                            </div>
                            {member.en_name && member.name && member.name !== member.en_name && (
                                <div className="member-en-name">({member.en_name})</div>
                            )}
                            {member.email && (
                                <div className="member-email">{member.email}</div>
                            )}
                            {member.mobile && (
                                <div className="member-mobile">{member.mobile}</div>
                            )}
                            {member.employee_no && (
                                <div className="member-employee-no">员工号: {member.employee_no}</div>
                            )}
                            {member.work_station && (
                                <div className="member-work-station">{member.work_station}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {members.length === 0 && (
                <div className="no-members">No members found</div>
            )}
        </div>
    );
};

export default MembersList;