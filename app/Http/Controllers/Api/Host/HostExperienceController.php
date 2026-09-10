<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use App\Models\ExperienceAvailability;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HostExperienceController extends Controller
{
    public function index(Request $request)
    {
        $experiences = Experience::where('host_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => ['data' => $experiences]]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez vérifier votre identité avant de publier une expérience.',
                'verification_required' => true,
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|min:20',
            'location' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'total_places' => 'nullable|integer|min:1',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'steps' => 'nullable|array',
            'step_images' => 'nullable|array',
            'step_images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $experience = Experience::create([
            'host_id' => $user->id,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'slug' => Experience::generateSlug($request->input('name')),
            'location' => $request->input('location'),
            'price' => $request->input('price'),
            'total_places' => $request->input('total_places', 1),
            'status' => $request->input('status', 'draft'),
            'requires_review' => true,
        ]);

        $this->syncImagesAndSteps($request, $experience);
        $this->syncAvailability($request, $experience);

        return response()->json([
            'success' => true,
            'message' => 'Expérience créée avec succès',
            'data' => $experience->refresh(),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $experience = Experience::where('host_id', $request->user()->id)->findOrFail($id);
        return response()->json(['success' => true, 'data' => $experience]);
    }

    public function update(Request $request, $id)
    {
        $experience = Experience::where('host_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|min:20',
            'location' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'total_places' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:draft,pending,active,inactive,rejected,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $experience->update($request->only(['name', 'description', 'location', 'price', 'total_places']));

        if ($request->input('status') === 'pending') {
            $experience->update(['status' => 'pending', 'requires_review' => true]);
        }

        $this->syncImagesAndSteps($request, $experience);
        $this->syncAvailability($request, $experience);

        return response()->json(['success' => true, 'message' => 'Expérience mise à jour', 'data' => $experience->refresh()]);
    }

    public function destroy(Request $request, $id)
    {
        $experience = Experience::where('host_id', $request->user()->id)->findOrFail($id);
        $experience->delete();

        return response()->json(['success' => true, 'message' => 'Expérience supprimée']);
    }

    public function getAvailability(Request $request, $id)
    {
        $experience = Experience::where('host_id', $request->user()->id)->findOrFail($id);

        $availability = $experience->availabilities()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->get();

        return response()->json(['success' => true, 'data' => $availability]);
    }

    public function setAvailability(Request $request, $id)
    {
        $experience = Experience::where('host_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'availability' => 'required|array',
            'availability.*.date' => 'required|date',
            'availability.*.slots' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($request->input('availability') as $entry) {
            ExperienceAvailability::updateOrCreate(
                ['experience_id' => $experience->id, 'date' => $entry['date']],
                ['slots' => $entry['slots'] ?? [], 'is_available' => true]
            );
        }

        return response()->json(['success' => true, 'message' => 'Disponibilités mises à jour']);
    }

    // ==================== MESSAGES ====================

    public function getConversations(Request $request)
    {
        $hostId = $request->user()->id;
        $experienceIds = Experience::where('host_id', $hostId)->pluck('id');

        $conversations = [];
        foreach ($experienceIds as $experienceId) {
            $experience = Experience::find($experienceId);
            $guestIds = Message::where('experience_id', $experienceId)
                ->where(function ($q) use ($hostId) {
                    $q->where('sender_id', $hostId)->orWhere('receiver_id', $hostId);
                })
                ->get(['sender_id', 'receiver_id'])
                ->flatMap(fn ($m) => [$m->sender_id, $m->receiver_id])
                ->filter(fn ($id) => $id !== $hostId)
                ->unique();

            foreach ($guestIds as $guestId) {
                $guest = User::find($guestId);
                $lastMessage = Message::where('experience_id', $experienceId)
                    ->where(function ($q) use ($hostId, $guestId) {
                        $q->where(['sender_id' => $hostId, 'receiver_id' => $guestId])
                          ->orWhere(['sender_id' => $guestId, 'receiver_id' => $hostId]);
                    })
                    ->orderByDesc('created_at')
                    ->first();

                $unread = Message::where('experience_id', $experienceId)
                    ->where('sender_id', $guestId)
                    ->where('receiver_id', $hostId)
                    ->where('is_read', false)
                    ->count();

                $conversations[] = [
                    'experience' => ['id' => $experience->id, 'name' => $experience->name, 'location' => $experience->location],
                    'guest' => [
                        'id' => $guest?->id,
                        'name' => $guest?->full_name,
                        'phone' => $guest?->phone,
                        'photo' => $guest?->profile_photo_url,
                    ],
                    'last_message' => $lastMessage ? ['message' => $lastMessage->message, 'sent_at' => $lastMessage->created_at] : null,
                    'unread_count' => $unread,
                ];
            }
        }

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    public function getMessages(Request $request, $experienceId, $guestId)
    {
        $hostId = $request->user()->id;

        $messages = Message::where('experience_id', $experienceId)
            ->where(function ($q) use ($hostId, $guestId) {
                $q->where(['sender_id' => $hostId, 'receiver_id' => $guestId])
                  ->orWhere(['sender_id' => $guestId, 'receiver_id' => $hostId]);
            })
            ->orderBy('created_at')
            ->get();

        Message::where('experience_id', $experienceId)
            ->where('sender_id', $guestId)
            ->where('receiver_id', $hostId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sendMessage(Request $request, $experienceId, $guestId)
    {
        $validator = Validator::make($request->all(), ['message' => 'required|string']);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $guestId,
            'experience_id' => $experienceId,
            'message' => $request->input('message'),
        ]);

        return response()->json(['success' => true, 'data' => $message], 201);
    }

    // ==================== PRIVÉ ====================

    private function syncImagesAndSteps(Request $request, Experience $experience): void
    {
        $images = $experience->images ?? [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('experiences/' . $experience->id, 'public');
                $images[] = Storage::url($path);
            }
        }

        $stepTexts = $request->input('steps', []);
        $stepFiles = $request->hasFile('step_images') ? $request->file('step_images') : [];

        if (!empty($stepTexts)) {
            $steps = [];
            foreach (array_values($stepTexts) as $index => $description) {
                $imageUrl = null;
                if (isset($stepFiles[$index])) {
                    $path = $stepFiles[$index]->store('experiences/' . $experience->id . '/steps', 'public');
                    $imageUrl = Storage::url($path);
                }
                $steps[] = ['order' => $index + 1, 'description' => $description, 'image_url' => $imageUrl];
            }
            $experience->steps = $steps;
        }

        $experience->images = $images;
        $experience->save();
    }

    private function syncAvailability(Request $request, Experience $experience): void
    {
        if (!$request->has('availability')) {
            return;
        }

        foreach ($request->input('availability') as $entry) {
            if (!is_array($entry) || empty($entry['date'])) {
                continue;
            }
            ExperienceAvailability::updateOrCreate(
                ['experience_id' => $experience->id, 'date' => $entry['date']],
                ['slots' => $entry['slots'] ?? [], 'is_available' => true]
            );
        }
    }
}
