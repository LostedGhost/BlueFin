<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .property-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .property-image { max-width: 100%; height: auto; margin: 15px 0; border-radius: 5px; }
        .action-button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .property-type { display: inline-block; background-color: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; margin-right: 10px; }
        .status { display: inline-block; background-color: #FFC107; color: #333; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Nouvelle Propriété en Attente d'Examen</h1>
        </div>

        <div class="content">
            <p>Bonjour,</p>
            <p>Une nouvelle propriété a été soumise pour examen et modération. Veuillez consulter les détails ci-dessous :</p>

            <div class="property-details">
                <h2 style="margin-top: 0; color: #4CAF50;">{{ $property['title'] ?? 'Propriété sans titre' }}</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Propriétaire :</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $property['host_name'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Téléphone :</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $property['host_phone'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Localisation :</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">{{ $property['city'] ?? 'N/A' }}, {{ $property['district'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type :</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><span class="property-type">{{ $property['property_type'] ?? 'N/A' }}</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Statut :</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><span class="status">EN ATTENTE</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>Date de soumission :</strong></td>
                        <td style="padding: 8px;">{{ $property['created_at'] ?? now()->format('d/m/Y H:i') }}</td>
                    </tr>
                </table>

                @if(!empty($property['image_url']))
                <div style="text-align: center;">
                    <img src="{{ $property['image_url'] }}" alt="Propriété" class="property-image" style="max-height: 300px;">
                </div>
                @endif

                @if(!empty($property['description']))
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                    <strong>Description :</strong>
                    <p style="margin: 10px 0;">{{ Str::limit($property['description'], 200) }}</p>
                </div>
                @endif
            </div>

            <p style="text-align: center;">
                <a href="{{ env('APP_URL') }}/admin/properties/{{ $property['id'] }}" class="action-button">Examiner la Propriété</a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Veuillez examiner cette propriété et approuver ou rejeter sa publication sur la plateforme.
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} Bluefin Immo. Tous les droits réservés.</p>
            <p>Ceci est un email automatisé. Veuillez ne pas répondre directement à cet email.</p>
        </div>
    </div>
</body>
</html>
