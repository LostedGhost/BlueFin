<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use Illuminate\Http\Request;

class ExperienceController extends Controller
{
    /**
     * Liste publique des expériences actives et publiées.
     */
    public function index(Request $request)
    {
        $query = Experience::with('host:id,first_name,last_name,phone')
            ->where('status', 'active')
            ->where('is_published', true);

        if ($request->filled('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $experiences = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => $experiences]);
    }

    /**
     * Expériences mises en avant (les mieux notées, en priorité).
     */
    public function featured(Request $request)
    {
        $experiences = Experience::with('host:id,first_name,last_name,phone')
            ->where('status', 'active')
            ->where('is_published', true)
            ->orderByDesc('average_rating')
            ->orderByDesc('bookings_count')
            ->limit($request->integer('limit', 10))
            ->get();

        return response()->json(['success' => true, 'data' => ['data' => $experiences]]);
    }

    public function show($id)
    {
        $experience = Experience::with('host:id,first_name,last_name,phone')
            ->where('status', 'active')
            ->where('is_published', true)
            ->find($id);

        if (!$experience) {
            return response()->json(['success' => false, 'message' => 'Expérience introuvable'], 404);
        }

        $experience->increment('views_count');

        return response()->json(['success' => true, 'data' => $experience]);
    }
}
