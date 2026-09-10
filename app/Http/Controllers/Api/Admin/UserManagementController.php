<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'role' => 'nullable|in:voyageur,hote,admin',
            'verified' => 'nullable|in:true,false',
            'suspended' => 'nullable|in:true,false',
            // Liste blanche stricte : une colonne arbitraire passée à orderBy()
            // pourrait provoquer une erreur SQL ou révéler le schéma de la table.
            'sort' => 'nullable|in:id,created_at,email,first_name,last_name',
            'direction' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $users = User::query()
            ->when($request->search, fn($q) => $q->where('first_name', 'like', '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->search) . '%')
                ->orWhere('last_name', 'like', '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->search) . '%')
                ->orWhere('email', 'like', '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->search) . '%'))
            ->when($request->role, fn($q) => $q->where('user_type', $request->role))
            ->when($request->verified === 'true', fn($q) => $q->whereNotNull('email_verified_at'))
            ->when($request->suspended === 'true', fn($q) => $q->where('suspended_until', '>', now()))
            ->orderBy($request->input('sort', 'id'), $request->input('direction', 'desc'))
            ->paginate($request->input('per_page', 15));

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
        $validator = Validator::make($request->all(), [
            'duration_days' => 'required|integer|min:1|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::findOrFail($id);
        $days = $request->integer('duration_days');
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

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé définitivement']);
    }
}
