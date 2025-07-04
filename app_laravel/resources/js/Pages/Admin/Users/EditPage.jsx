import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminPrimaryButton from '@/Components/AdminPrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import OutletSelector from './Partials/OutletSelector';
import SearchableSelect from '@/Components/SearchableSelect';

export default function EditPage({ user, availableOutlets, assignableRoles }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'manager',
        outlet_id: user.assigned_outlet_id || '',
        outlet_ids: user.managed_outlet_ids || [],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id), {
            onSuccess: () => router.visit(route('admin.users.index')),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800">Edit User: {user.name}</h2>}
        >
            <Head title={`Edit User: ${user.name}`} />
            <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            onChange={handleChange}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            onChange={handleChange}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel value="Role" />
                        <div className="mt-2 space-y-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="role"
                                    value="manager"
                                    checked={data.role === 'manager'}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Manager</span>
                            </label>
                            <div className="block">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="outlet-user"
                                        checked={data.role === 'outlet-user'}
                                        onChange={handleChange}
                                        className="text-green-600 focus:ring-green-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Outlet User</span>
                                </label>
                            </div>
                        </div>
                        <InputError message={errors.role} className="mt-2" />
                    </div>
                    {data.role === 'outlet-user' ? (
                        <div className="mb-4">
                            <InputLabel htmlFor="outlet_id" value="Assign to Outlet" />
                            <SearchableSelect
                                options={availableOutlets}
                                value={data.outlet_id}
                                onChange={(value) => setData('outlet_id', value)}
                                placeholder="Select an outlet"
                                className="mt-1"
                                getOptionLabel={(option) => option.name}
                                getOptionValue={(option) => option.id}
                                getOptionDescription={() => ''}
                            />
                            <InputError message={errors.outlet_id} className="mt-2" />
                        </div>
                    ) : (
                        <OutletSelector
                            outlets={availableOutlets}
                            selectedIds={data.outlet_ids}
                            onSelectionChange={(ids) => setData('outlet_ids', ids)}
                            error={errors.outlet_ids}
                        />
                    )}
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => router.visit(route('admin.users.index'))}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                        <AdminPrimaryButton type="submit" disabled={processing}>
                            Update User
                        </AdminPrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
} 