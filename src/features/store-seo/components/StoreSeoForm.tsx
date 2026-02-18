import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import StoreSeoSkeleton from './StoreSeoSkeleton';
import ImagePreview from './ImagePreview';
import { CircleHelp } from 'lucide-react';

import {
    DokanToaster,
    SimpleInput,
    TextArea,
    useToast,
    Tooltip,
} from '@getdokan/dokan-ui';
import { __ } from '@wordpress/i18n';
import { DokanButton } from '@dokan/components';

export type SeoMeta = {
    meta_title: string;
    meta_desc: string;
    meta_keywords: string;
    og_title: string;
    og_desc: string;
    og_image: string;
    og_url: string;
    twitter_title: string;
    twitter_desc: string;
    twitter_image: string;
    twitter_url: string;
    linkedin_title: string;
    linkedin_desc: string;
    linkedin_image: string;
};

const StoreSeoForm = () => {
    const toast = useToast();

    const [ seoData, setSeoData ] = useState( {} as SeoMeta );
    const [ loading, setLoading ] = useState( true );
    const [ isSaving, setIsSaving ] = useState( false );

    const [ selectedOgImage, setSelectedOgImage ] = useState< string | null >( null );
    const [ selectedTwitterImage, setSelectedTwitterImage ] = useState< string | null >( null );
    const [ selectedLinkedinImage, setSelectedLinkedinImage ] = useState< string | null >( null );

    const mapKeys: Record<string, string> = {
        'dokan-seo-meta-title': 'meta_title',
        'dokan-seo-meta-desc': 'meta_desc',
        'dokan-seo-meta-keywords': 'meta_keywords',
        'dokan-seo-og-title': 'og_title',
        'dokan-seo-og-desc': 'og_desc',
        'dokan-seo-og-image': 'og_image',
        'dokan-seo-twitter-title': 'twitter_title',
        'dokan-seo-twitter-desc': 'twitter_desc',
        'dokan-seo-twitter-image': 'twitter_image',
        'dokan-seo-linkedin-title': 'linkedin_title',
        'dokan-seo-linkedin-desc': 'linkedin_desc',
        'dokan-seo-linkedin-image': 'linkedin_image',
    };

    const fetchSeoData = async () => {
        try {
            setLoading( true );
            const data: Array<{ id: string; value: string; url?: string } > = await apiFetch( {
                path: '/dokan/v2/settings/store_seo',
            } );
            const allowKeys = Object.keys( mapKeys );
            const filteredSeoData = data
                .filter( ( item ) => allowKeys.includes( item.id ) )
                .reduce( ( acc: Record<string, string>, item ) => {
                    acc[ mapKeys[ item.id ] ] = item.value ?? '';
                    return acc;
                }, {} );

            const ogImageItem = data.find( ( item ) => item.id === 'dokan-seo-og-image' );
            if ( ogImageItem?.url ) {
                setSelectedOgImage( ogImageItem.url );
            }

            const twitterImageItem = data.find( ( item ) => item.id === 'dokan-seo-twitter-image' );
            if ( twitterImageItem?.url ) {
                setSelectedTwitterImage( twitterImageItem.url );
            }

            const linkedinImageItem = data.find( ( item ) => item.id === 'dokan-seo-linkedin-image' );
            if ( linkedinImageItem?.url ) {
                setSelectedLinkedinImage( linkedinImageItem.url );
            }

            setSeoData( filteredSeoData as SeoMeta );
        } catch ( error ) {
            toast( {
                type: 'error',
                title: __( 'Failed to fetch store SEO data', 'dokan-react-boilerplate' ),
            } );
        } finally {
            setLoading( false );
        }
    };

    const changeHandler = ( e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> ) => {
        const { name, value } = e.target;
        setSeoData( {
            ...seoData,
            [ name ]: value,
        } );
    };

    useEffect( () => {
        fetchSeoData();
    }, [] );

    const saveSeoData = async ( e: React.FormEvent ) => {
        e.preventDefault();
        const items = Object.entries( seoData ).map( ( [ key, value ] ) => ( {
            id: `dokan-seo-${ key.replace( /_/g, '-' ) }`,
            value,
        } ) );

        try {
            setIsSaving( true );
            await apiFetch( {
                path: '/dokan/v2/settings/store_seo',
                method: 'POST',
                data: { items },
            } );
            toast( {
                type: 'success',
                title: __( 'Store SEO data saved successfully', 'dokan-react-boilerplate' ),
            } );
        } catch ( error ) {
            toast( {
                type: 'error',
                title: __( 'Failed to save store SEO data', 'dokan-react-boilerplate' ),
            } );
        } finally {
            setIsSaving( false );
        }
    };

    const onImageSelect = ( file: { id: number; url: string }, section: string ) => {
        const id = String( file.id );
        if ( section === 'twitter' ) {
            setSeoData( { ...seoData, twitter_image: id } );
            setSelectedTwitterImage( file.url );
            return;
        }
        if ( section === 'linkedin' ) {
            setSeoData( { ...seoData, linkedin_image: id } );
            setSelectedLinkedinImage( file.url );
            return;
        }
        setSeoData( { ...seoData, og_image: id } );
        setSelectedOgImage( file.url );
    };

    const removeImage = ( section: string ) => {
        if ( section === 'facebook' ) {
            setSeoData( { ...seoData, og_image: '' } );
            setSelectedOgImage( null );
            return;
        }
        if ( section === 'twitter' ) {
            setSeoData( { ...seoData, twitter_image: '' } );
            setSelectedTwitterImage( null );
            return;
        }
        if ( section === 'linkedin' ) {
            setSeoData( { ...seoData, linkedin_image: '' } );
            setSelectedLinkedinImage( null );
        }
    };

    return (
        <>
            <DokanToaster />
            { loading ? (
                <StoreSeoSkeleton />
            ) : (
                <form onSubmit={ saveSeoData } className="p-2 space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_meta_title"
                            className="flex justify-end text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'SEO Title:', 'dokan-react-boilerplate' ) }
                            <Tooltip
                                content={ __(
                                    'SEO Title is shown as the title of your store page.',
                                    'dokan-react-boilerplate'
                                ) }
                            >
                                <CircleHelp className="size-5 ml-2" />
                            </Tooltip>
                        </label>
                        <div className="col-span-3">
                            <SimpleInput
                                input={ {
                                    id: 'dokan_seo_meta_title',
                                    name: 'meta_title',
                                    value: seoData.meta_title ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'SEO Title', 'dokan-react-boilerplate' ),
                                    type: 'text',
                                } }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_meta_desc"
                            className="flex justify-end text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'Meta Description:', 'dokan-react-boilerplate' ) }
                            <Tooltip
                                content={ __(
                                    'The meta description is often shown as the black text under the title in a search result.',
                                    'dokan-react-boilerplate'
                                ) }
                            >
                                <CircleHelp className="size-5 ml-2" />
                            </Tooltip>
                        </label>
                        <div className="col-span-3">
                            <TextArea
                                input={ {
                                    id: 'dokan_seo_meta_desc',
                                    name: 'meta_desc',
                                    value: seoData.meta_desc ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'Meta Description', 'dokan-react-boilerplate' ),
                                } }
                                className="h-20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_meta_keywords"
                            className="flex justify-end text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'Meta Keywords:', 'dokan-react-boilerplate' ) }
                            <Tooltip
                                content={ __(
                                    'Insert some comma separated keywords for better ranking of your store page.',
                                    'dokan-react-boilerplate'
                                ) }
                            >
                                <CircleHelp className="size-5 ml-2" />
                            </Tooltip>
                        </label>
                        <div className="col-span-3">
                            <SimpleInput
                                input={ {
                                    id: 'dokan_seo_meta_keywords',
                                    name: 'meta_keywords',
                                    value: seoData.meta_keywords ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'Meta Keywords', 'dokan-react-boilerplate' ),
                                } }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_og_title"
                            className="block text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'Facebook Title:', 'dokan-react-boilerplate' ) }
                        </label>
                        <div className="col-span-3">
                            <SimpleInput
                                input={ {
                                    id: 'dokan_seo_og_title',
                                    name: 'og_title',
                                    value: seoData.og_title ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'Facebook Title', 'dokan-react-boilerplate' ),
                                } }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_og_desc"
                            className="block text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'Facebook Description:', 'dokan-react-boilerplate' ) }
                        </label>
                        <div className="col-span-3">
                            <TextArea
                                input={ {
                                    id: 'dokan_seo_og_desc',
                                    name: 'og_desc',
                                    value: seoData.og_desc ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'Facebook Description', 'dokan-react-boilerplate' ),
                                } }
                                className="h-20"
                            />
                        </div>
                    </div>

                    <ImagePreview
                        upload={ onImageSelect }
                        section="facebook"
                        path={ selectedOgImage }
                        action={ removeImage }
                        label={ __( 'Facebook Image:', 'dokan-react-boilerplate' ) }
                    />

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_twitter_title"
                            className="block text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'Twitter Title:', 'dokan-react-boilerplate' ) }
                        </label>
                        <div className="col-span-3">
                            <SimpleInput
                                input={ {
                                    id: 'dokan_seo_twitter_title',
                                    name: 'twitter_title',
                                    value: seoData.twitter_title ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'Twitter Title', 'dokan-react-boilerplate' ),
                                } }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_twitter_desc"
                            className="block text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'Twitter Description:', 'dokan-react-boilerplate' ) }
                        </label>
                        <div className="col-span-3">
                            <TextArea
                                input={ {
                                    id: 'dokan_seo_twitter_desc',
                                    name: 'twitter_desc',
                                    value: seoData.twitter_desc ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'Twitter Description', 'dokan-react-boilerplate' ),
                                } }
                                className="h-20"
                            />
                        </div>
                    </div>

                    <ImagePreview
                        upload={ onImageSelect }
                        section="twitter"
                        path={ selectedTwitterImage }
                        action={ removeImage }
                        label={ __( 'Twitter Image:', 'dokan-react-boilerplate' ) }
                    />

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_linkedin_title"
                            className="block text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'LinkedIn Title:', 'dokan-react-boilerplate' ) }
                        </label>
                        <div className="col-span-3">
                            <SimpleInput
                                input={ {
                                    id: 'dokan_seo_linkedin_title',
                                    name: 'linkedin_title',
                                    value: seoData.linkedin_title ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'LinkedIn Title', 'dokan-react-boilerplate' ),
                                } }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <label
                            htmlFor="dokan_seo_linkedin_desc"
                            className="block text-right text-sm font-bold text-gray-900"
                        >
                            { __( 'LinkedIn Description:', 'dokan-react-boilerplate' ) }
                        </label>
                        <div className="col-span-3">
                            <TextArea
                                input={ {
                                    id: 'dokan_seo_linkedin_desc',
                                    name: 'linkedin_desc',
                                    value: seoData.linkedin_desc ?? '',
                                    onChange: changeHandler,
                                    placeholder: __( 'LinkedIn Description', 'dokan-react-boilerplate' ),
                                } }
                                className="h-20"
                            />
                        </div>
                    </div>

                    <ImagePreview
                        upload={ onImageSelect }
                        section="linkedin"
                        path={ selectedLinkedinImage }
                        action={ removeImage }
                        label={ __( 'LinkedIn Image:', 'dokan-react-boilerplate' ) }
                    />

                    <div className="flex justify-end">
                        <DokanButton
                            color="primary"
                            type="submit"
                            className="dokan-btn"
                            disabled={ isSaving }
                        >
                            { __( 'Save Changes', 'dokan-react-boilerplate' ) }
                        </DokanButton>
                    </div>
                </form>
            ) }
        </>
    );
};

export default StoreSeoForm;
