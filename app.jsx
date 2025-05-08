// Initialize Supabase with your credentials
const supabaseUrl = 'https://aoxwtvxavuddykkmlela.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFveHd0dnhhdnVkZHlra21sZWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTY0OTgsImV4cCI6MjA2MjA3MjQ5OH0.SXng4P6mo36mMOG1lwoTXjZ4e-p9kfNwzTnqlU2uFUo';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Test connection immediately
(async function testSupabaseConnection() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase auth error:', error);
      return;
    }
    
    console.log('Supabase connected successfully! Session:', session);
    
    // If no session exists, this is normal for non-logged-in users
    if (!session) {
      console.log('No active session - user is not logged in');
    }
  } catch (err) {
    console.error('Failed to initialize Supabase:', err);
  }
})();

// Rest of your React application code...
const { createRoot } = ReactDOM;
const { useState, useEffect, useRef } = React;
const { BrowserRouter, Routes, Route, Link, useNavigate, Outlet } = ReactRouterDOM;

// Navbar Component
function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.user_metadata?.is_admin === true);
      setUserEmail(user?.email || '');
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/profile" className="hover:text-gray-300">My Profile</Link>
          {isAdmin && (
            <>
              <Link to="/admin/employees" className="hover:text-gray-300">Employees</Link>
              <Link to="/admin/attendance" className="hover:text-gray-300">Attendance</Link>
              <Link to="/admin/salaries" className="hover:text-gray-300">Salaries</Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>{userEmail}</span>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// ... [Rest of your component code remains exactly the same as before]
// Continue with all your other components (Login, Dashboard, EmployeeDetails, etc.)

// App Component
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin/employees" element={<Employees />} />
          <Route path="/admin/attendance" element={<ManageAttendance />} />
          <Route path="/admin/salaries" element={<ManageSalaries />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Render the app
const root = createRoot(document.getElementById('root'));
root.render(<App />);
