
'use client';
import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import AdminAuthWrapper from '../AdminAuthWrapper';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Loader2, Trash2, Pencil, Sparkles, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { DailyChallenge } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ChallengeFormData = Omit<DailyChallenge, 'id' | 'icon'>;
type ChallengeWithId = DailyChallenge & { id: string };

function EditChallengeForm({ challenge }: { challenge: ChallengeWithId }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<ChallengeFormData>({
    defaultValues: {
      ...challenge,
      reward: Number(challenge.reward),
      targetValue: Number(challenge.targetValue),
    },
  });

  const onSubmit: SubmitHandler<ChallengeFormData> = async (data) => {
    try {
      const challengeDocRef = doc(firestore, 'challenges', challenge.id);
      await updateDoc(challengeDocRef, {
          ...data,
          reward: Number(data.reward),
          targetValue: Number(data.targetValue)
      });
      toast({
        title: 'Challenge Updated!',
        description: `"${data.title}" has been successfully updated.`,
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating challenge:', err);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to update challenge. Please try again.',
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Challenge</DialogTitle>
          <DialogDescription>
            Make changes to &quot;{challenge.title}&quot;. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
               <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dailyCheckIn">Daily Check-in</SelectItem>
                      <SelectItem value="playGame">Play Game</SelectItem>
                      <SelectItem value="watchAd">Watch Ad</SelectItem>
                      <SelectItem value="completeOffer">Complete Offer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input id="targetValue" type="number" {...register('targetValue', { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward">Reward Coins</Label>
              <Input id="reward" type="number" {...register('reward', { required: true, valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddChallengeForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<ChallengeFormData>();

  const onSubmit: SubmitHandler<ChallengeFormData> = async (data) => {
    try {
      const challengesCollection = collection(firestore, 'challenges');
      await addDoc(challengesCollection, {
        ...data,
        reward: Number(data.reward),
        targetValue: Number(data.targetValue),
      });
      toast({
        title: 'Challenge Added!',
        description: `"${data.title}" has been added to the daily challenges.`,
      });
      reset({ title: '', description: '', reward: 0, targetValue: 1 });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to add challenge.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Challenge</CardTitle>
        <CardDescription>
          Fill out the form below to add a new daily challenge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                defaultValue='playGame'
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dailyCheckIn">Daily Check-in</SelectItem>
                      <SelectItem value="playGame">Play Game</SelectItem>
                      <SelectItem value="watchAd">Watch Ad</SelectItem>
                      <SelectItem value="completeOffer">Complete Offer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
               <Controller
                control={control}
                name="difficulty"
                defaultValue='Easy'
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input id="targetValue" type="number" {...register('targetValue', { required: true, valueAsNumber: true })} defaultValue={1}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward">Reward Coins</Label>
              <Input id="reward" type="number" {...register('reward', { required: true, valueAsNumber: true })} defaultValue={10}/>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Challenge
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChallengeList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const challengesCollection = useMemo(() => collection(firestore, 'challenges'), [firestore]);
  const { data: challenges, isLoading } = useCollection<ChallengeWithId>(challengesCollection);

  const handleDelete = async (challengeId: string) => {
    try {
      await deleteDoc(doc(firestore, 'challenges', challengeId));
      toast({
        title: 'Challenge Deleted',
        description: 'The challenge has been removed.',
      });
    } catch (error: any) {
      console.error('Error deleting challenge: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the challenge.',
      });
    }
  };

  if (isLoading) {
    return <p>Loading challenges...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Challenges</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges?.map((challenge) => (
          <Card key={challenge.id} className="group relative">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className='text-sm font-bold text-primary'>{challenge.difficulty}</p>
                  <h3 className="font-semibold text-lg">{challenge.title}</h3>
                </div>
                <div className='flex items-center gap-2 text-primary font-bold'>
                    <Trophy className='w-5 h-5' />
                    <span>{challenge.reward}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
              <p className="text-xs text-muted-foreground mt-2">Type: {challenge.type} / Target: {challenge.targetValue}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
               <EditChallengeForm challenge={challenge} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the challenge &quot;{challenge.title}&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(challenge.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
        {challenges?.length === 0 && (
          <p className="text-muted-foreground">No challenges found.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminChallengesPage() {
  return (
    <AdminAuthWrapper>
      <PageHeader
        title="Admin: Manage Challenges"
        description="Add, edit, or delete daily challenges for users."
      />
      <div className="space-y-8">
        <AddChallengeForm />
        <ChallengeList />
      </div>
    </AdminAuthWrapper>
  );
}
