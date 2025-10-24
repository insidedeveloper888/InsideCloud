import React, { useState, useEffect } from 'react';
import axios from 'axios';
import clientConfig from '../../config/client_config.js';
import './index.css';

const getOrigin = (apiPort) => {
    const configuredOrigin = clientConfig.apiOrigin;
    if (configuredOrigin && configuredOrigin.length > 0) {
        return configuredOrigin;
    }
    // Default: use same-origin so CRA proxy can forward /api to localhost:8989
    return window.location.origin;
};

const DepartmentsList = () => {
    const [departmentUsers, setDepartmentUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDepartmentUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(
                `${getOrigin(clientConfig.apiPort)}${clientConfig.getDepartmentUsersPath}`,
                {
                    withCredentials: true,
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                }
            );

            if (response.data && response.data.code === 0) {
                setDepartmentUsers(response.data.data || []);
            } else {
                throw new Error(response.data?.msg || 'Failed to fetch department users');
            }
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
            console.error('Error fetching department users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartmentUsers();
    }, []);

    const handleRefresh = () => {
        fetchDepartmentUsers();
    };

    return (
        <div className="departments-container">
            <div className="departments-header">
                <h2>部门成员列表</h2>
                <button
                    className="refresh-btn"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? '刷新中...' : '刷新'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    错误: {error}
                </div>
            )}

            {loading ? (
                <div className="loading">加载中...</div>
            ) : (
                <div className="departments-list">
                    {departmentUsers.length === 0 ? (
                        <div className="no-data">暂无部门成员数据</div>
                    ) : (
                        departmentUsers.map((user, index) => (
                            <div key={user.user_id || index} className="department-card">
                                <div className="department-name">
                                    {user.department_info?.department_name || '未知部门'}
                                </div>
                                <div className="department-avatar">
                                    {user.avatar_72 ? (
                                        <img 
                                            src={user.avatar_72} 
                                            alt={user.name || user.en_name}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="avatar-placeholder" style={{display: user.avatar_72 ? 'none' : 'flex'}}>
                                        {(user.name || user.en_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="department-info">
                                    <div className="department-name">
                                        {user.name || user.en_name || 'Unknown User'}
                                    </div>
                                    {user.en_name && user.name && user.name !== user.en_name && (
                                        <div className="department-en-name">({user.en_name})</div>
                                    )}
                                    <div className="department-user-id">ID: {user.user_id}</div>
                                    <div className="department-dept">
                                        部门: {user.department_info?.department_name || '未知部门'}
                                    </div>
                                    {user.job_title && (
                                        <div className="department-job-title">职位: {user.job_title}</div>
                                    )}
                                    {user.email && (
                                        <div className="department-email">{user.email}</div>
                                    )}
                                    {user.mobile && (
                                        <div className="department-mobile">{user.mobile}</div>
                                    )}
                                    {user.employee_no && user.employee_no.trim() && (
                                        <div className="department-employee-no">员工号: {user.employee_no}</div>
                                    )}
                                    {user.city && user.city.trim() && (
                                        <div className="department-city">城市: {user.city}</div>
                                    )}
                                    {user.work_station && user.work_station.trim() && (
                                        <div className="department-work-station">工作地点: {user.work_station}</div>
                                    )}
                                    {user.employee_type && (
                                        <div className="department-employee-type">员工类型: {user.employee_type}</div>
                                    )}
                                    {user.gender && (
                                        <div className="department-gender">性别: {user.gender}</div>
                                    )}
                                    <div className="department-status">
                                        状态: {user.status?.is_activated ? '已激活' : '未激活'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DepartmentsList;