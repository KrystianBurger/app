import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Teams Context
const TeamsContext = createContext();

const TeamsProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamsContext, setTeamsContext] = useState(null);

  useEffect(() => {
    initializeTeams();
  }, []);

  const initializeTeams = async () => {
    try {
      // Check if running in Teams
      if (window.microsoftTeams) {
        await window.microsoftTeams.app.initialize();
        
        const context = await window.microsoftTeams.app.getContext();
        setTeamsContext(context);
        
        // Get user info from Teams context
        const userEmail = context.user?.userPrincipalName || context.user?.loginHint;
        const userName = context.user?.displayName;
        
        if (userEmail) {
          // Check admin status from backend
          const adminResponse = await axios.get(`${API}/check-admin/${userEmail}`);
          const isAdmin = adminResponse.data.is_admin;
          
          setUser({
            email: userEmail,
            name: userName || userEmail,
            isAdmin: isAdmin
          });
        }
      } else {
        // Fallback for development - simulate Teams user
        console.log('Running outside Teams - using demo user');
        
        // TODO: ZASTĄP SWOIM EMAILEM ADMINISTRATORA
        // Ten email powinien być taki sam jak ADMIN_EMAIL w backend .env
        const demoEmail = process.env.REACT_APP_DEMO_ADMIN_EMAIL || 'admin@twoja-domena.pl';
        const adminResponse = await axios.get(`${API}/check-admin/${demoEmail}`);
        const isAdmin = adminResponse.data.is_admin;
        
        setUser({
          email: demoEmail,
          name: demoEmail.split('@')[0],
          isAdmin: isAdmin
        });
      }
    } catch (error) {
      console.error('Teams initialization failed:', error);
      // Fallback user for demo
      const demoEmail = process.env.REACT_APP_DEMO_ADMIN_EMAIL || 'demo.user@twoja-domena.pl';
      setUser({
        email: demoEmail,
        name: demoEmail.split('@')[0],
        isAdmin: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeamsContext.Provider value={{ user, loading, teamsContext }}>
      {children}
    </TeamsContext.Provider>
  );
};

const useTeams = () => useContext(TeamsContext);

// Image Modal Component
const ImageModal = ({ image, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-4xl p-4">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <img
              src={`data:image/png;base64,${image}`}
              alt={title}
              className="max-w-full max-h-96 object-contain mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Ładowanie HD - Baza Problemów IT...</p>
    </div>
  </div>
);

// Admin Management Component
const AdminManagement = ({ onBack }) => {
  const { user } = useTeams();
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API}/admins`);
      setAdmins(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setLoading(false);
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName) return;
    
    setAdding(true);
    try {
      await axios.post(`${API}/admins`, {
        email: newAdminEmail,
        name: newAdminName,
        added_by: user.email
      });
      setNewAdminEmail('');
      setNewAdminName('');
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      if (error.response?.status === 400) {
        alert('Ten administrator już istnieje w systemie.');
      } else {
        alert('Wystąpił błąd podczas dodawania administratora.');
      }
    } finally {
      setAdding(false);
    }
  };

  const deleteAdmin = async (adminEmail) => {
    if (window.confirm(`Czy na pewno chcesz usunąć administratora ${adminEmail}?`)) {
      try {
        await axios.delete(`${API}/admins/${adminEmail}`);
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
        if (error.response?.status === 400) {
          alert('Nie można usunąć ostatniego administratora.');
        } else {
          alert('Wystąpił błąd podczas usuwania administratora.');
        }
      }
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">👥 Zarządzanie administratorami</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition duration-200"
        >
          ← Powrót
        </button>
      </div>

      {/* Add New Admin Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">➕ Dodaj nowego administratora</h3>
        <form onSubmit={addAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email administratora *
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@twoja-firma.pl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imię i nazwisko *
              </label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jan Kowalski"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
          >
            {adding ? 'Dodawanie...' : '➕ Dodaj administratora'}
          </button>
        </form>
      </div>

      {/* Current Admins List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">📋 Obecni administratorzy ({admins.length})</h3>
        <div className="space-y-3">
          {admins.map(admin => (
            <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{admin.name}</h4>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="text-xs text-gray-500">
                      Dodany: {new Date(admin.created_at).toLocaleDateString('pl-PL')}
                      {admin.added_by !== 'system' && ` przez ${admin.added_by}`}
                    </p>
                  </div>
                </div>
              </div>
              
              {admins.length > 1 && (
                <button
                  onClick={() => deleteAdmin(admin.email)}
                  className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:border-red-500 text-sm"
                  title="Usuń administratora"
                >
                  🗑️ Usuń
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {admins.length === 1 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ W systemie musi być przynajmniej jeden administrator. Dodaj kolejnego przed usunięciem obecnego.
          </p>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useTeams();
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusOptions = ['Nowy', 'W toku', 'Rozwiązany'];
  const categoryOptions = ['Windows', 'Drukarki', 'Poczta', 'OneDrive', 'Inne'];

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    filterProblems();
  }, [problems, statusFilter, categoryFilter, searchQuery]);

  const fetchProblems = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${API}/problems?${params}`);
      setProblems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = problems;
    
    // For admin view, show only "Nowy" and "W toku" problems
    if (currentView === 'admin') {
      filtered = filtered.filter(p => p.status === 'Nowy' || p.status === 'W toku');
    }
    
    setFilteredProblems(filtered);
  };

  const deleteProblem = async (problemId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten problem? Tej operacji nie można cofnąć.')) {
      try {
        await axios.delete(`${API}/problems/${problemId}`);
        fetchProblems();
        if (selectedProblem && selectedProblem.id === problemId) {
          setCurrentView('list');
        }
      } catch (error) {
        console.error('Error deleting problem:', error);
        alert('Wystąpił błąd podczas usuwania problemu.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Nowy': return 'bg-red-100 text-red-800';
      case 'W toku': return 'bg-yellow-100 text-yellow-800';
      case 'Rozwiązany': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Windows': return '🪟';
      case 'Drukarki': return '🖨️';
      case 'Poczta': return '📧';
      case 'OneDrive': return '☁️';
      case 'Inne': return '❓';
      default: return '📝';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🛠️ HD - Baza Problemów IT</h1>
              <span className="text-sm text-gray-500">
                Witaj, {user.name} {user.isAdmin && '(Administrator)'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user.isAdmin && (
                <>
                  <button
                    onClick={() => setCurrentView(currentView === 'admin-management' ? 'list' : 'admin-management')}
                    className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                      currentView === 'admin-management'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {currentView === 'admin-management' ? '👥 Widok główny' : '👥 Administratorzy'}
                  </button>
                  
                  <button
                    onClick={() => setCurrentView(currentView === 'admin' ? 'list' : 'admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                      currentView === 'admin'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {currentView === 'admin' ? '👥 Widok użytkownika' : '⚙️ Panel admina'}
                  </button>
                </>
              )}
              
              {currentView === 'list' && (
                <button
                  onClick={() => setCurrentView('add')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                >
                  ➕ Dodaj problem
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'list' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-72">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🔍 Wyszukaj
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Trigger search after user stops typing
                      setTimeout(() => fetchProblems(), 500);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Wpisz słowo kluczowe..."
                  />
                </div>
                
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      fetchProblems();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wszystkie statusy</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      fetchProblems();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wszystkie kategorie</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Problems Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map(problem => (
                <div
                  key={problem.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{getCategoryIcon(problem.category)}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                          {problem.status}
                        </span>
                        <button
                          onClick={() => deleteProblem(problem.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          title="Usuń problem"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <h3 
                      className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                      onClick={() => {
                        setSelectedProblem(problem);
                        setCurrentView('details');
                      }}
                    >
                      {problem.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{problem.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{problem.category}</span>
                      <span>📅 {new Date(problem.created_at).toLocaleString('pl-PL')}</span>
                    </div>

                    {problem.attachments && problem.attachments.length > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        📎 {problem.attachments.length} załącznik(ów)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredProblems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak wyników</h3>
                <p className="text-gray-600">
                  {searchQuery ? 
                    `Nie znaleziono problemów zawierających "${searchQuery}"` : 
                    'Nie znaleziono problemów spełniających kryteria filtrowania.'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {currentView === 'add' && (
          <AddProblemForm 
            user={user}
            onBack={() => setCurrentView('list')} 
            onSuccess={() => {
              fetchProblems();
              setCurrentView('list');
            }}
          />
        )}

        {currentView === 'details' && selectedProblem && (
          <ProblemDetails
            problem={selectedProblem}
            user={user}
            onBack={() => setCurrentView('list')}
            onUpdate={fetchProblems}
            onDelete={deleteProblem}
          />
        )}

        {currentView === 'admin' && user.isAdmin && (
          <AdminPanel
            problems={filteredProblems}
            onUpdate={fetchProblems}
            onSelectProblem={(problem) => {
              setSelectedProblem(problem);
              setCurrentView('admin-solution');
            }}
          />
        )}

        {currentView === 'admin-solution' && selectedProblem && user.isAdmin && (
          <AdminSolution
            problem={selectedProblem}
            user={user}
            onBack={() => setCurrentView('admin')}
            onSuccess={() => {
              fetchProblems();
              setCurrentView('admin');
            }}
          />
        )}

        {currentView === 'admin-management' && user.isAdmin && (
          <AdminManagement
            onBack={() => setCurrentView('list')}
          />
        )}
      </main>
    </div>
  );
};

// Add Problem Form Component
const AddProblemForm = ({ user, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Windows'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const categoryOptions = ['Windows', 'Drukarki', 'Poczta', 'OneDrive', 'Inne'];

  const handleFileUpload = async (files) => {
    const uploadedFiles = [];
    for (let file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/upload`, formData);
        uploadedFiles.push(response.data.base64_data);
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
    setAttachments([...attachments, ...uploadedFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/problems`, {
        ...formData,
        attachments,
        created_by: user.name || user.email
      });
      onSuccess();
    } catch (error) {
      console.error('Problem creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">➕ Dodaj nowy problem</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition duration-200"
        >
          ← Powrót
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tytuł problemu *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Krótko opisz problem..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategoria *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis problemu *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Opisz szczegółowo problem, który wystąpił..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Załączniki (zdjęcia, dokumenty)
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            accept="image/*,.pdf,.doc,.docx"
          />
          
          {attachments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">📎 Załączniki ({attachments.length}):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative border rounded overflow-hidden">
                    <img
                      src={`data:image/png;base64,${attachment}`}
                      alt={`Załącznik ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Zgłaszane przez:</strong> {user.name} ({user.email})
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : '💾 Zapisz problem'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Problem Details Component  
const ProblemDetails = ({ problem, user, onBack, onUpdate, onDelete }) => {
  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    if (problem.status === 'Rozwiązany') {
      fetchInstruction();
    } else {
      setLoading(false);
    }
  }, [problem]);

  const fetchInstruction = async () => {
    try {
      const response = await axios.get(`${API}/instructions/${problem.id}`);
      setInstruction(response.data);
    } catch (error) {
      console.error('Error fetching instruction:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (image, title) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Nowy': return 'bg-red-100 text-red-800';
      case 'W toku': return 'bg-yellow-100 text-yellow-800';
      case 'Rozwiązany': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Windows': return '🪟';
      case 'Drukarki': return '🖨️';
      case 'Poczta': return '📧';
      case 'OneDrive': return '☁️';
      case 'Inne': return '❓';
      default: return '📝';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔍 Szczegóły problemu</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDelete(problem.id)}
            className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:border-red-500"
            title="Usuń problem"
          >
            🗑️ Usuń
          </button>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition duration-200"
          >
            ← Powrót
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getCategoryIcon(problem.category)}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{problem.title}</h3>
              <p className="text-gray-600">{problem.category}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(problem.status)}`}>
            {problem.status}
          </span>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">📝 Opis problemu</h4>
          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{problem.description}</p>
        </div>

        {/* User Attachments - visible to everyone */}
        {problem.attachments && problem.attachments.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              📎 Załączniki {user.isAdmin && '(pomogą zrozumieć problem)'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {problem.attachments.map((attachment, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={`data:image/png;base64,${attachment}`}
                    alt={`Załącznik ${index + 1}`}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => openImageModal(attachment, `Załącznik ${index + 1}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <span>📅 {new Date(problem.created_at).toLocaleString('pl-PL')}</span>
        </div>

        {problem.status === 'Rozwiązany' && instruction && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">✅ Rozwiązanie</h4>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{instruction.instruction_text}</p>
            </div>

            {instruction.images && instruction.images.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">📸 Instrukcje krok po kroku</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instruction.images.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={`data:image/png;base64,${image}`}
                        alt={`Instrukcja ${index + 1}`}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => openImageModal(image, `Instrukcja krok ${index + 1}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded-lg">
              📅 {new Date(instruction.created_at).toLocaleString('pl-PL')}
            </div>
          </div>
        )}

        {problem.status !== 'Rozwiązany' && user.isAdmin && (
          <div className="border-t pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⏳ Ten problem jeszcze nie został rozwiązany. Jako administrator możesz dodać rozwiązanie w panelu admina.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        isOpen={imageModalOpen}
        onClose={closeImageModal}
        title="Powiększony obraz"
      />
    </div>
  );
};

// Admin Panel Component
const AdminPanel = ({ problems, onUpdate, onSelectProblem }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Panel administratora</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Problemy oczekujące na rozwiązanie: <span className="font-semibold text-blue-600">{problems.length}</span>
        </p>
      </div>

      <div className="space-y-4">
        {problems.map(problem => (
          <div
            key={problem.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition duration-200"
            onClick={() => onSelectProblem(problem)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">
                    {problem.category === 'Windows' ? '🪟' : 
                     problem.category === 'Drukarki' ? '🖨️' : 
                     problem.category === 'Poczta' ? '📧' : 
                     problem.category === 'OneDrive' ? '☁️' : '❓'}
                  </span>
                  <h3 className="font-semibold text-gray-900">{problem.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    problem.status === 'Nowy' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {problem.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{problem.description}</p>
                
                {/* Show user attachments preview for admin */}
                {problem.attachments && problem.attachments.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      📎 {problem.attachments.length} załącznik(ów) - podpowiedź do problemu
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>📂 Kategoria: {problem.category}</span>
                  <span>📅 {new Date(problem.created_at).toLocaleDateString('pl-PL')}</span>
                </div>
              </div>
              <div className="ml-4">
                <span className="text-blue-600 text-sm font-medium">✏️ Dodaj rozwiązanie →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {problems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Świetna robota!</h3>
          <p className="text-gray-600">Wszystkie problemy zostały rozwiązane.</p>
        </div>
      )}
    </div>
  );
};

// Admin Solution Component
const AdminSolution = ({ problem, user, onBack, onSuccess }) => {
  const [instructionText, setInstructionText] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const handleImageUpload = async (files) => {
    const uploadedImages = [];
    for (let file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/upload`, formData);
        uploadedImages.push(response.data.base64_data);
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    }
    setImages([...images, ...uploadedImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const openImageModal = (image, title) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/instructions`, {
        problem_id: problem.id,
        instruction_text: instructionText,
        images,
        created_by: user.name || user.email
      });
      onSuccess();
    } catch (error) {
      console.error('Instruction creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">✏️ Dodaj rozwiązanie</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition duration-200"
        >
          ← Powrót
        </button>
      </div>

      {/* Problem Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">📋 Problem do rozwiązania:</h3>
        <h4 className="font-medium text-gray-800 mb-1">{problem.title}</h4>
        <p className="text-gray-700 text-sm mb-2">{problem.description}</p>
        
        {/* Show user attachments */}
        {problem.attachments && problem.attachments.length > 0 && (
          <div className="mt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">📎 Załączniki użytkownika (podpowiedź):</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {problem.attachments.map((attachment, index) => (
                <div key={index} className="border rounded overflow-hidden">
                  <img
                    src={`data:image/png;base64,${attachment}`}
                    alt={`Załącznik ${index + 1}`}
                    className="w-full h-20 object-cover cursor-pointer hover:opacity-80"
                    onClick={() => openImageModal(attachment, `Załącznik użytkownika ${index + 1}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>📂 Kategoria: {problem.category}</span>
          <span>📅 {new Date(problem.created_at).toLocaleString('pl-PL')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instrukcja rozwiązania *
          </label>
          <textarea
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Opisz krok po kroku jak rozwiązać ten problem..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zrzuty ekranu rozwiązania
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(Array.from(e.target.files))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">📸 Instrukcje ({images.length}):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative border rounded overflow-hidden">
                    <img
                      src={`data:image/png;base64,${image}`}
                      alt={`Instrukcja ${index + 1}`}
                      className="w-full h-20 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => openImageModal(image, `Instrukcja krok ${index + 1}`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>👨‍💼 Rozwiązanie dodawane przez:</strong> {user.name} ({user.email})
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : '✅ Zapisz rozwiązanie'}
          </button>
        </div>
      </form>

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        isOpen={imageModalOpen}
        onClose={closeImageModal}
        title="Powiększony obraz"
      />
    </div>
  );
};

// Main App Component
function App() {
  const { user, loading } = useTeams();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

// Main App with Teams Provider
export default function AppWithTeams() {
  return (
    <TeamsProvider>
      <App />
    </TeamsProvider>
  );
}