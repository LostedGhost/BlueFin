<?php

namespace App\Http\Controllers\Api\Host;

use App\Services\PhotoStorage;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HostServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::where('host_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => ['data' => $services]]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez vérifier votre identité avant de publier un service.',
                'verification_required' => true,
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:20|max:10000',
            'location' => 'required|string|max:255',
            'service_type' => 'required|string|max:100',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0|max:10000000',
            'duration_minutes' => 'nullable|integer|min:1|max:1440',
            'images' => 'nullable|array|max:20',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $service = Service::create([
            'host_id' => $user->id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'slug' => Service::generateSlug($request->input('title')),
            'location' => $request->input('location'),
            'service_type' => $request->input('service_type'),
            'category' => $request->input('category'),
            'price' => $request->input('price'),
            'duration_minutes' => $request->input('duration_minutes', 60),
            'status' => $request->input('status', 'draft'),
            'requires_review' => true,
        ]);

        $this->syncImages($request, $service);

        return response()->json([
            'success' => true,
            'message' => 'Service créé avec succès',
            'data' => $service->refresh(),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $service = Service::where('host_id', $request->user()->id)->findOrFail($id);
        return response()->json(['success' => true, 'data' => $service]);
    }

    public function update(Request $request, $id)
    {
        $service = Service::where('host_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|min:20|max:10000',
            'location' => 'sometimes|string|max:255',
            'service_type' => 'sometimes|string|max:100',
            'category' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0|max:10000000',
            'duration_minutes' => 'sometimes|integer|min:1|max:1440',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $service->update($request->only([
            'title', 'description', 'location', 'service_type', 'category', 'price', 'duration_minutes',
        ]));

        if ($request->input('status') === 'pending') {
            $service->update(['status' => 'pending', 'requires_review' => true]);
        }

        $this->syncImages($request, $service);

        return response()->json(['success' => true, 'message' => 'Service mis à jour', 'data' => $service->refresh()]);
    }

    public function destroy(Request $request, $id)
    {
        $service = Service::where('host_id', $request->user()->id)->findOrFail($id);
        $service->delete();

        return response()->json(['success' => true, 'message' => 'Service supprimé']);
    }

    public function dashboard(Request $request)
    {
        $hostId = $request->user()->id;

        $services = Service::where('host_id', $hostId)->get();
        $bookings = \App\Models\ServiceBooking::whereIn('service_id', $services->pluck('id'));

        $stats = [
            'total_services' => $services->count(),
            'active_services' => $services->where('status', 'active')->count(),
            'total_bookings' => $bookings->count(),
            'total_revenue' => (clone $bookings)->where('payment_status', 'paid')->sum('total_amount'),
        ];

        return response()->json(['success' => true, 'data' => $services, 'stats' => $stats]);
    }

    private function syncImages(Request $request, Service $service): void
    {
        if (!$request->hasFile('images')) {
            return;
        }

        $images = $service->images ?? [];
        foreach ($request->file('images') as $file) {
            $stored = app(PhotoStorage::class)->upload($file, 'services/' . $service->id);
            $images[] = $stored['url'];
        }

        $service->update(['images' => $images]);
    }
}
