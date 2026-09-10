<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use App\Models\ModerationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExperienceModerationController extends Controller
{
    public function index(Request $request)
    {
        $query = Experience::with('host:id,first_name,last_name,phone')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function show($id)
    {
        $experience = Experience::with('host:id,first_name,last_name,phone,email')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $experience]);
    }

    public function approve(Request $request, $id)
    {
        $validator = Validator::make($request->all(), ['notes' => 'nullable|string']);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $experience = Experience::findOrFail($id);
        $experience->update([
            'status' => 'active',
            'is_published' => true,
            'published_at' => now(),
            'requires_review' => false,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_notes' => $request->input('notes'),
        ]);

        ModerationLog::create([
            'moderator_id' => $request->user()->id,
            'moderatable_type' => Experience::class,
            'moderatable_id' => $experience->id,
            'action' => 'approve',
            'reason' => $request->input('notes'),
            'new_data' => ['status' => 'active'],
        ]);

        return response()->json(['success' => true, 'message' => 'Expérience approuvée et publiée', 'data' => $experience]);
    }

    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:10',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $experience = Experience::findOrFail($id);
        $experience->update([
            'status' => 'rejected',
            'is_published' => false,
            'requires_review' => false,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_notes' => $request->input('notes'),
            'rejection_reason' => $request->input('reason'),
            'moderation_attempts' => $experience->moderation_attempts + 1,
        ]);

        ModerationLog::create([
            'moderator_id' => $request->user()->id,
            'moderatable_type' => Experience::class,
            'moderatable_id' => $experience->id,
            'action' => 'reject',
            'reason' => $request->input('reason'),
            'new_data' => ['status' => 'rejected'],
        ]);

        return response()->json(['success' => true, 'message' => 'Expérience rejetée', 'data' => $experience]);
    }
}
