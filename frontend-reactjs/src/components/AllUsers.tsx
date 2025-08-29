import axios from "axios";
import { ChevronDown, ChevronUp, Filter, RefreshCw, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import "../components/css/AllUsers.css";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

type SortField = keyof User;
type SortOrder = "asc" | "desc";

const AllUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3000/users");
      setUsers(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ChevronUp className="sort-icon-inactive" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="sort-icon-active" />
    ) : (
      <ChevronDown className="sort-icon-active" />
    );
  };

  const filteredAndSortedUsers = users
    .filter((user) => {
      const search = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone.includes(search) ||
        user.role.toLowerCase().includes(search) ||
        user.status.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "createdAt") {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
      if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const getStatusClass = (status: string) => {
    return `status-badge status-${status.toLowerCase()}`;
  };

  const getRoleClass = (role: string) => {
    return `role-badge role-${role.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-button">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <div className="header-title">
          <h1>All Users</h1>
          <span className="users-count">
            {filteredAndSortedUsers.length} users
          </span>
        </div>

        <div className="header-actions">
          <div className="search-container">
            {/* <Search size={18} className="search-icon" /> */}
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <X size={16} className="clear-search" onClick={clearSearch} />
            )}
          </div>

          <button onClick={fetchUsers} className="refresh-button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                <div className="sortable-header">
                  <span>Name</span>
                  {getSortIcon("name")}
                </div>
              </th>
              <th onClick={() => handleSort("email")}>
                <div className="sortable-header">
                  <span>Email</span>
                  {getSortIcon("email")}
                </div>
              </th>
              <th onClick={() => handleSort("phone")}>
                <div className="sortable-header">
                  <span>Phone</span>
                  {getSortIcon("phone")}
                </div>
              </th>
              <th onClick={() => handleSort("role")}>
                <div className="sortable-header">
                  <span>Role</span>
                  {getSortIcon("role")}
                </div>
              </th>
              <th onClick={() => handleSort("status")}>
                <div className="sortable-header">
                  <span>Status</span>
                  {getSortIcon("status")}
                </div>
              </th>
              <th onClick={() => handleSort("createdAt")}>
                <div className="sortable-header">
                  <span>Created At</span>
                  {getSortIcon("createdAt")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <Filter size={48} className="empty-icon" />
                  <h3>No users found</h3>
                  <p>Try adjusting your search or refresh the page</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="user-row">
                  <td className="user-name">{user.name}</td>
                  <td className="user-email">{user.email}</td>
                  <td className="user-phone">{user.phone}</td>
                  <td className="user-role">
                    <span className={getRoleClass(user.role)}>{user.role}</span>
                  </td>
                  <td className="user-status">
                    <span className={getStatusClass(user.status)}>
                      {user.status}
                    </span>
                  </td>
                  <td className="user-date">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllUsers;
