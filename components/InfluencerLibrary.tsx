'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, User, Sparkles, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import InfluencerProfileForm from './InfluencerProfileForm';
import { Badge } from '@/components/ui/badge';

interface InfluencerProfile {
  id: string;
  name: string;
  nickname: string;
  niche: string;
  base_image_url: string;
  ethnicity: string;
  age_range: string;
  created_at: string;
}

export default function InfluencerLibrary() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<InfluencerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('id, name, nickname, niche, base_image_url, ethnicity, age_range, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error('Failed to load profiles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;

    try {
      const { error } = await supabase
        .from('influencer_profiles')
        .delete()
        .eq('id', deletingProfile);

      if (error) throw error;

      toast.success('Profile deleted successfully');
      setDeletingProfile(null);
      loadProfiles();
    } catch (error: any) {
      toast.error('Failed to delete profile: ' + error.message);
    }
  };

  const handleSuccess = () => {
    setShowCreateDialog(false);
    setEditingProfile(null);
    loadProfiles();
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to manage your AI influencers</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            <Sparkles className="w-8 h-8 text-orange-600" />
            Your AI Influencers
          </h2>
          <p className="text-muted-foreground text-base">
            Create and manage consistent AI influencer characters
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-5 h-5 mr-2" />
          Create New Influencer
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="py-16 space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <Users className="w-20 h-20 mx-auto text-orange-600 relative" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">No influencers yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-base">
                Create your first AI influencer to start generating consistent content with a unique personality and style
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setShowCreateDialog(true)} size="lg" className="shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Influencer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2">
              <CardHeader className="pb-3 bg-gradient-to-br from-orange-50 to-amber-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate">{profile.name}</CardTitle>
                    {profile.nickname && (
                      <CardDescription className="text-sm">&quot;{profile.nickname}&quot;</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-orange-100"
                      onClick={() => setEditingProfile(profile.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-100"
                      onClick={() => setDeletingProfile(profile.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {profile.base_image_url ? (
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                    <img
                      src={profile.base_image_url}
                      alt={profile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center ring-2 ring-orange-200">
                    <User className="w-16 h-16 text-orange-400" />
                  </div>
                )}
                <div className="space-y-3">
                  {profile.niche && (
                    <Badge variant="secondary" className="font-medium">
                      {profile.niche}
                    </Badge>
                  )}
                  {profile.ethnicity && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {profile.ethnicity}
                      {profile.age_range && `, ${profile.age_range}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New AI Influencer</DialogTitle>
            <DialogDescription>
              Define your influencer&apos;s master identity for consistent content generation
            </DialogDescription>
          </DialogHeader>
          <InfluencerProfileForm
            onSuccess={handleSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI Influencer</DialogTitle>
            <DialogDescription>
              Update your influencer&apos;s profile information
            </DialogDescription>
          </DialogHeader>
          <InfluencerProfileForm
            profileId={editingProfile || undefined}
            onSuccess={handleSuccess}
            onCancel={() => setEditingProfile(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProfile} onOpenChange={(open) => !open && setDeletingProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Influencer Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this influencer profile? This action cannot be undone.
              All videos associated with this profile will remain but will no longer be linked to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
