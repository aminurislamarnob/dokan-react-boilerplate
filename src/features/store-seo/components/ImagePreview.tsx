import { __ } from '@wordpress/i18n';
import { DokanButton, MediaUploader } from '@dokan/components';

type ImagePreviewProps = {
    path: string | null;
    section: string;
    upload: ( value: unknown, section: string ) => void;
    action: ( section: string ) => void;
    label: string;
};

const ImagePreview = ( {
    path,
    section,
    action,
    upload,
    label,
}: ImagePreviewProps ) => {
    const handleDelete = () => {
        action( section );
    };
    const handleUpload = ( value: unknown ) => {
        upload( value, section );
    };

    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="block text-right text-sm font-bold text-gray-900">
                { label }
            </div>
            { path ? (
                <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3 group relative w-36">
                        <img
                            src={ path }
                            alt="og-image"
                            className="object-contain w-full min-h-16"
                        />
                        <div className="cursor-pointer group-hover:block hidden absolute inset-0 bg-black/40">
                            { /* eslint-disable-next-line jsx-a11y/click-events-have-key-events */ }
                            <div
                                role="button"
                                tabIndex={ 0 }
                                onClick={ handleDelete }
                                className="fas fa-close text-2xl absolute text-red-500 left-[calc(50%_-_9px)] top-[calc(50%_-_12px)]"
                            ></div>
                        </div>
                    </div>
                </div>
            ) : (
                <MediaUploader as="div" onSelect={ handleUpload }>
                    <DokanButton variant="secondary" className="w-max gap-1">
                        <i className="fas fa-cloud-upload-alt" />
                        { __( 'Upload', 'dokan-react-boilerplate' ) }
                    </DokanButton>
                </MediaUploader>
            ) }
        </div>
    );
};

export default ImagePreview;
