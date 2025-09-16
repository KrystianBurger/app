import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (token && role && username) {
      setUser({ token, role, username });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      const { token, role, username: user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', user);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token, role, username: user });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Login Component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) {
      setError('Nieprawidłowe dane logowania');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">IT HelpDesk</h1>
          <p className="text-gray-600">Zaloguj się do systemu</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa użytkownika
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin lub user"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin123 lub user123"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusOptions = ['Nowy', 'W toku', 'Rozwiązany'];
  const categoryOptions = ['Sprzęt', 'Oprogramowanie', 'Sieć', 'Inne'];

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    filterProblems();
  }, [problems, statusFilter, categoryFilter]);

  const fetchProblems = async () => {
    try {
      const response = await axios.get(`${API}/problems`);
      setProblems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = problems;
    
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    // For admin view, show only "Nowy" and "W toku" problems
    if (currentView === 'admin') {
      filtered = filtered.filter(p => p.status === 'Nowy' || p.status === 'W toku');
    }
    
    setFilteredProblems(filtered);
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
      case 'Sprzęt': return '🖥️';
      case 'Oprogramowanie': return '💻';
      case 'Sieć': return '🌐';
      case 'Inne': return '❓';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">IT HelpDesk</h1>
              <span className="text-sm text-gray-500">
                Witaj, {user.username} ({user.role === 'admin' ? 'Administrator' : 'Użytkownik'})
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user.role === 'admin' && (
                <button
                  onClick={() => setCurrentView(currentView === 'admin' ? 'list' : 'admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    currentView === 'admin'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {currentView === 'admin' ? 'Widok użytkownika' : 'Panel admina'}
                </button>
              )}
              
              {currentView === 'list' && (
                <button
                  onClick={() => setCurrentView('add')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                >
                  + Dodaj problem
                </button>
              )}
              
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 transition duration-200"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'list' && (
          <>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    onChange={(e) => setCategoryFilter(e.target.value)}
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
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedProblem(problem);
                    setCurrentView('details');
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{getCategoryIcon(problem.category)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                        {problem.status}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{problem.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{problem.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{problem.category}</span>
                      <span>{new Date(problem.created_at).toLocaleDateString('pl-PL')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProblems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak problemów</h3>
                <p className="text-gray-600">Nie znaleziono problemów spełniających kryteria filtrowania.</p>
              </div>
            )}
          </>
        )}

        {currentView === 'add' && (
          <AddProblemForm 
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
            onBack={() => setCurrentView('list')}
            onUpdate={fetchProblems}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            problems={filteredProblems}
            onUpdate={fetchProblems}
            onSelectProblem={(problem) => {
              setSelectedProblem(problem);
              setCurrentView('admin-solution');
            }}
          />
        )}

        {currentView === 'admin-solution' && selectedProblem && (
          <AdminSolution
            problem={selectedProblem}
            onBack={() => setCurrentView('admin')}
            onSuccess={() => {
              fetchProblems();
              setCurrentView('admin');
            }}
          />
        )}
      </main>
    </div>
  );
};

// Add Problem Form Component
const AddProblemForm = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Sprzęt'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const categoryOptions = ['Sprzęt', 'Oprogramowanie', 'Sieć', 'Inne'];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/problems`, {
        ...formData,
        attachments
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
        <h2 className="text-2xl font-bold text-gray-900">Dodaj nowy problem</h2>
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
            Załączniki
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            accept="image/*,.pdf,.doc,.docx"
          />
          {attachments.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Załączono {attachments.length} plik(ów)
            </p>
          )}
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
            {loading ? 'Zapisywanie...' : 'Zapisz problem'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Problem Details Component  
const ProblemDetails = ({ problem, onBack, onUpdate }) => {
  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);

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
      case 'Sprzęt': return '🖥️';
      case 'Oprogramowanie': return '💻';
      case 'Sieć': return '🌐';
      case 'Inne': return '❓';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Szczegóły problemu</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition duration-200"
        >
          ← Powrót
        </button>
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
          <h4 className="font-semibold text-gray-900 mb-2">Opis problemu</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Utworzono przez: {problem.created_by}</span>
          <span>Data: {new Date(problem.created_at).toLocaleString('pl-PL')}</span>
        </div>

        {problem.status === 'Rozwiązany' && instruction && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">🎯 Rozwiązanie</h4>
            
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{instruction.instruction_text}</p>
            </div>

            {instruction.images && instruction.images.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Zrzuty ekranu</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instruction.images.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={`data:image/png;base64,${image}`}
                        alt={`Instrukcja ${index + 1}`}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 mt-4">
              Rozwiązanie dodane przez: {instruction.created_by} • {new Date(instruction.created_at).toLocaleString('pl-PL')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Panel Component
const AdminPanel = ({ problems, onUpdate, onSelectProblem }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Panel administratora</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Problemy oczekujące na rozwiązanie: <span className="font-semibold">{problems.length}</span>
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
                  <span className="text-lg">{problem.category === 'Sprzęt' ? '🖥️' : problem.category === 'Oprogramowanie' ? '💻' : problem.category === 'Sieć' ? '🌐' : '❓'}</span>
                  <h3 className="font-semibold text-gray-900">{problem.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    problem.status === 'Nowy' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {problem.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{problem.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Kategoria: {problem.category}</span>
                  <span>Utworzono: {new Date(problem.created_at).toLocaleDateString('pl-PL')}</span>
                  <span>Autor: {problem.created_by}</span>
                </div>
              </div>
              <div className="ml-4">
                <span className="text-blue-600 text-sm font-medium">Dodaj rozwiązanie →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {problems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Brak problemów do rozwiązania</h3>
          <p className="text-gray-600">Wszystkie problemy zostały rozwiązane.</p>
        </div>
      )}
    </div>
  );
};

// Admin Solution Component
const AdminSolution = ({ problem, onBack, onSuccess }) => {
  const [instructionText, setInstructionText] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/instructions`, {
        problem_id: problem.id,
        instruction_text: instructionText,
        images
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
        <h2 className="text-2xl font-bold text-gray-900">Dodaj rozwiązanie</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition duration-200"
        >
          ← Powrót
        </button>
      </div>

      {/* Problem Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">{problem.title}</h3>
        <p className="text-gray-700 text-sm">{problem.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>Kategoria: {problem.category}</span>
          <span>Autor: {problem.created_by}</span>
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
            Zrzuty ekranu
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
              <p className="text-sm text-gray-600 mb-2">Dodano {images.length} obraz(ów)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <img
                      src={`data:image/png;base64,${image}`}
                      alt={`Podgląd ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {loading ? 'Zapisywanie...' : 'Zapisz rozwiązanie'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Main App Component
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie aplikacji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}

// Main App with Auth Provider
export default function AppWithAuth() {
  return (
    <AuthContext.Provider value={{}}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AuthContext.Provider>
  );
}