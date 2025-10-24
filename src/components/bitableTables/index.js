import React, { useState, useEffect, useCallback } from 'react';
import './index.css';

const BitableTables = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appToken, setAppToken] = useState('J8tAbd9oEaxuLZsQbLwlNuHdgoc');

    const fetchTables = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/get_bitable_tables?app_token=${appToken}`);
            const data = await response.json();
            
            if (data.code === 0) {
                setTables(data.data.tables || []);
            } else {
                setError(data.msg || '获取表列表失败');
            }
        } catch (err) {
            setError('网络错误，请检查连接');
            console.error('获取Lark Base表列表失败:', err);
        } finally {
            setLoading(false);
        }
    }, [appToken]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const handleRefresh = () => {
        fetchTables();
    };

    const handleAppTokenChange = (e) => {
        setAppToken(e.target.value);
    };

    const handleAppTokenSubmit = () => {
        if (appToken.trim()) {
            fetchTables();
        }
    };

    return (
        <div className="bitable-tables-container">
            <div className="bitable-header">
                <h2>Lark Base 表列表</h2>
                <div className="app-token-input">
                    <input
                        type="text"
                        value={appToken}
                        onChange={handleAppTokenChange}
                        placeholder="请输入AppToken"
                        className="app-token-field"
                    />
                    <button onClick={handleAppTokenSubmit} className="submit-btn">
                        查询
                    </button>
                </div>
                <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
                    {loading ? '刷新中...' : '刷新'}
                </button>
            </div>

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <span>正在获取表列表...</span>
                </div>
            )}

            {error && (
                <div className="error">
                    <p>错误: {error}</p>
                    <button onClick={handleRefresh} className="retry-btn">
                        重试
                    </button>
                </div>
            )}

            {!loading && !error && tables.length === 0 && (
                <div className="no-tables">
                    <p>该多维表格中没有找到任何表</p>
                </div>
            )}

            {!loading && !error && tables.length > 0 && (
                <div className="tables-grid">
                    {tables.map((table, index) => (
                        <div key={table.table_id} className="table-card">
                            <div className="table-header">
                                <div className="table-icon">
                                    📊
                                </div>
                                <div className="table-info">
                                    <h3 className="table-name">{table.name}</h3>
                                    {table.is_primary && (
                                        <span className="primary-badge">主表</span>
                                    )}
                                </div>
                            </div>
                            <div className="table-details">
                                <div className="table-detail-item">
                                    <span className="label">表ID:</span>
                                    <span className="value">{table.table_id}</span>
                                </div>
                                <div className="table-detail-item">
                                    <span className="label">版本:</span>
                                    <span className="value">{table.revision || 'N/A'}</span>
                                </div>
                                <div className="table-detail-item">
                                    <span className="label">序号:</span>
                                    <span className="value">{index + 1}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && tables.length > 0 && (
                <div className="tables-summary">
                    <p>共找到 {tables.length} 个表</p>
                    <p>AppToken: {appToken}</p>
                </div>
            )}
        </div>
    );
};

export default BitableTables;