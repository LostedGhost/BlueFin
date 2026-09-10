<?php

namespace App\Http\Controllers\Api\Host;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HostUploadController extends Controller
{
    /**
     * Upload générique d'images (utilisé par l'espace hôte Expériences pour
     * uploader des visuels avant même la création de l'expérience).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'images' => 'required|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'type' => 'nullable|string|in:experience,step,service',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = $request->input('type', 'experience');
        $folder = 'uploads/' . $request->user()->id . '/' . $type;

        $urls = [];
        foreach ($request->file('images') as $file) {
            $path = $file->store($folder, 'public');
            $urls[] = Storage::url($path);
        }

        return response()->json(['success' => true, 'urls' => $urls]);
    }
}
