<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModerationLog;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceModerationController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('host:id,first_name,last_name,phone')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function show($id)
    {
        $service = Service::with('host:id,first_name,last_name,phone,email')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $service]);
    }

    public function approve(Request $request, $id)
    {
        $validator = Validator::make($request->all(), ['notes' => 'nullable|string']);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $service = Service::findOrFail($id);
        $service->update([
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
            'moderatable_type' => Service::class,
            'moderatable_id' => $service->id,
            'action' => 'approve',
            'reason' => $request->input('notes'),
            'new_data' => ['status' => 'active'],
        ]);

        return response()->json(['success' => true, 'message' => 'Service approuvé et publié', 'data' => $service]);
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

        $service = Service::findOrFail($id);
        $service->update([
            'status' => 'rejected',
            'is_published' => false,
            'requires_review' => false,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'moderation_notes' => $request->input('notes'),
            'rejection_reason' => $request->input('reason'),
        ]);

        ModerationLog::create([
            'moderator_id' => $request->user()->id,
            'moderatable_type' => Service::class,
            'moderatable_id' => $service->id,
            'action' => 'reject',
            'reason' => $request->input('reason'),
            'new_data' => ['status' => 'rejected'],
        ]);

        return response()->json(['success' => true, 'message' => 'Service rejeté', 'data' => $service]);
    }
}
