<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->search, fn($q) => $q->where('first_name', 'like', "%{$request->search}%")
                ->orWhere('last_name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->role, fn($q) => $q->where('user_type', $request->role))
            ->when($request->verified === 'true', fn($q) => $q->whereNotNull('email_verified_at'))
            ->when($request->suspended === 'true', fn($q) => $q->where('suspended_until', '>', now()))
            ->orderBy($request->sort ?? 'id', $request->direction ?? 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function verify(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->email_verified_at = now();
        $user->save();

        return response()->json(['message' => 'Utilisateur vérifié', 'user' => $user]);
    }

    public function suspend(int $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $days = $request->input('duration_days', 30);
        $user->suspended_until = Carbon::now()->addDays($days);
        $user->save();

        return response()->json(['message' => "Utilisateur suspendu pour {$days} jours", 'user' => $user]);
    }

    public function activate(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->suspended_until = null;
        $user->save();

        return response()->json(['message' => 'Utilisateur réactivé', 'user' => $user]);
    }

    public function delete(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé définitivement']);
    }
}