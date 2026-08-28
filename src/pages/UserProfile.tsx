import { useAuth } from "../hooks/useAuth";
import { useLens } from "../hooks/useLens";
import { useFlow } from "../hooks/useFlow";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import {
  BarChart3,
  Users,
  Settings,
  CreditCard,
  Palette,
  Shield,
  LogOut,
  HelpCircle,
} from "lucide-react";

const UserProfilePage = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  // Lens stays quiet infrastructure: disconnected on sign-out, never displayed.
  const { isAuthenticating, logout: lensLogout } = useLens();
  const { disconnect: flowDisconnect } = useFlow();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const handleSignOut = async () => {
    try {
      await Promise.all([signOut(), lensLogout(), flowDisconnect()]);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out completely');
      console.error('Sign out error:', error);
    }
  };

  const isLoading = authLoading || isAuthenticating;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
        <Avatar className="w-24 h-24 border-4 border-primary">
          <AvatarImage
            src={user.profile.avatar}
            alt={user.profile.name || user.profile.username}
          />
          <AvatarFallback>
            {(user.profile.name || user.profile.username)?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold">
            {user.profile.name || user.profile.username}
          </h1>
          <p className="mt-2">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 max-w-md">
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-3"
          onClick={() => navigate("/progress")}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">Progress</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-3"
          onClick={() => navigate("/subscription")}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs">Premium</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-3"
          onClick={() => navigate("/community")}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Community</span>
        </Button>
      </div>

      {/* Consolidation: settings live inside Profile. Theme, legal and sign-out
          are surfaced here instead of a separate /settings destination. */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto"
            onClick={cycleTheme}
          >
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </span>
            <span className="text-sm text-muted-foreground capitalize">
              {theme === 'system' ? 'System' : theme}
            </span>
          </Button>
          <Button variant="ghost" className="w-full justify-start px-4 py-3 h-auto" asChild>
            <Link to="/privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start px-4 py-3 h-auto" asChild>
            <Link to="/terms">
              <HelpCircle className="h-4 w-4 mr-2" />
              Terms of Service
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3 h-auto text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold">Role:</span> {profile.role}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Consolidation: the profile shows practice proof, not chain
            mechanics — credentials live on /progress. */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verified Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Every camera-verified session becomes a verified record of
              practice — progress you can prove.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/progress")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View My Progress
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfilePage;
