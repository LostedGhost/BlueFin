<?php

namespace App\Http\Controllers\Api;

use App\Support\PublicPayload;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('host:id,first_name,last_name,profile_photo')
            ->where('status', 'active')
            ->where('is_published', true);

        if ($request->filled('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $services = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => PublicPayload::offers($services)]);
    }

    public function featured(Request $request)
    {
        $services = Service::with('host:id,first_name,last_name,profile_photo')
            ->where('status', 'active')
            ->where('is_published', true)
            ->orderByDesc('average_rating')
            ->limit($request->integer('limit', 10))
            ->get();

        return response()->json(['success' => true, 'data' => ['data' => PublicPayload::offers($services)]]);
    }

    public function byCategory(Request $request, string $category)
    {
        $services = Service::where('status', 'active')
            ->where('is_published', true)
            ->where('category', $category)
            ->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => PublicPayload::offers($services)]);
    }

    public function byType(Request $request, string $serviceType)
    {
        $services = Service::where('status', 'active')
            ->where('is_published', true)
            ->where('service_type', $serviceType)
            ->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => PublicPayload::offers($services)]);
    }

    public function show($id)
    {
        $service = Service::with('host:id,first_name,last_name,profile_photo')
            ->where('status', 'active')
            ->where('is_published', true)
            ->find($id);

        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Service introuvable'], 404);
        }

        return response()->json(['success' => true, 'data' => PublicPayload::offers($service)]);
    }
}
