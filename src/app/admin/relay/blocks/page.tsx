import AdminHeader from '@/components/admin/AdminHeader';
import { getRelayBlockConfigsWithModulesAction } from '@/actions/relay-actions';
import { BlockGallery } from './BlockGallery';

export default async function BlockGalleryPage() {
    const result = await getRelayBlockConfigsWithModulesAction();

    return (
        <div>
            <AdminHeader
                title="Block UI Gallery"
                subtitle="Visual preview of every relay block template and their module mappings"
            />
            <div className="container mx-auto py-8 px-6">
                <BlockGallery configs={result.configs} />
            </div>
        </div>
    );
}
