import { useAuth } from "../hooks/useAuth";
import { useLens } from "../hooks/useLens";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { FollowButton } from "../components/social/SocialButton";

const UserProfilePage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentAccount, isAuthenticating } = useLens();

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
            src={currentAccount?.metadata?.picture || user.profile.avatar}
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
          {currentAccount && (
            <div className="flex items-center gap-4">
              <p className="text-xl text-muted-foreground">
                @{currentAccount.username?.fullHandle || currentAccount.id}
              </p>
              <FollowButton address={currentAccount.address} />
            </div>
          )}
          <p className="mt-2">{user?.email}</p>
        </div>
      </div>

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
              <li>
                <span className="font-semibold">Creator Verified:</span>{" "}
                {profile.creator_verified ? "Yes" : "No"}
              </li>
              {/* Add more Supabase stats here */}
            </ul>
          </CardContent>
        </Card>

        {currentAccount ? (
          <Card>
            <CardHeader>
              <CardTitle>Lens Protocol Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <span className="font-semibold">Profile ID:</span>{" "}
                  {currentAccount.address}
                </li>
                <li>
                  <span className="font-semibold">Username:</span>{" "}
                  {currentAccount.username?.fullHandle || "No username set"}
                </li>
                <li>
                  <span className="font-semibold">Followers:</span>{" "}
                  {currentAccount.stats?.followers || 0}
                </li>
                <li>
                  <span className="font-semibold">Following:</span>{" "}
                  {currentAccount.stats?.following || 0}
                </li>
                <li>
                  <span className="font-semibold">Posts:</span>{" "}
                  {currentAccount.stats?.posts || 0}
                </li>
                <li>
                  <span className="font-semibold">Comments:</span>{" "}
                  {currentAccount.stats?.comments || 0}
                </li>
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center text-center">
            <CardHeader>
              <CardTitle>No Lens Profile Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This user has not linked a wallet with a Lens Protocol profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
