export default function AccountPage() {
    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Account & Billing</h1>
                <p className="text-gray-600">Manage your subscription and billing information coming soon.</p>
                <div className="mt-6">
                    <a href="/dashboard/upgrade" className="text-blue-600 hover:text-blue-700 font-medium">
                        View Upgrade Options →
                    </a>
                </div>
            </div>
        </div>
    );
}
