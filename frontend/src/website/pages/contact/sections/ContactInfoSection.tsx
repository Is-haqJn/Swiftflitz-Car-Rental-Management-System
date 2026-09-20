import {
    useContactSettings,
    usePublicContactBranches,
} from '@/shared/hooks/queries/useSettings';

export const ContactInfoSection = () => {
    const { data: settingsRes } = useContactSettings();
    const { data: branchesRes } = usePublicContactBranches();

    const s = settingsRes?.data ?? {};
    const branches = branchesRes?.data ?? [];

    if (s.contact_branch_locations_enabled === false || branches.length === 0)
        return null;

    const title = s.contact_branch_locations_title ?? 'Our Branches';

    return (
        <div className="section-full p-b120">
            <div className="container">
                <div className="section-head center wt-small-separator-outer">
                    <h2 className="twm-large-title">{title}</h2>
                </div>
                <div className="section-content">
                    <div className="twm-get-info-section">
                        <div className="row">
                            {branches.map(branch => {
                                const items = [
                                    branch.phone
                                        ? {
                                              icon: 'feather feather-phone-call',
                                              label: 'Phone',
                                              value: branch.phone,
                                              href: `tel:${branch.phone}`,
                                          }
                                        : null,
                                    branch.email
                                        ? {
                                              icon: 'feather feather-mail',
                                              label: 'Email',
                                              value: branch.email,
                                              href: `mailto:${branch.email}`,
                                          }
                                        : null,
                                    branch.address
                                        ? {
                                              icon: 'feather feather-home',
                                              label: 'Address',
                                              value: branch.address,
                                              href: undefined,
                                          }
                                        : null,
                                ].filter(
                                    (item): item is NonNullable<typeof item> =>
                                        item !== null
                                );

                                return (
                                    <div
                                        key={branch.id}
                                        className="col-lg-4 col-md-6"
                                    >
                                        <div className="twm-get-info-wrap st02-small">
                                            <h3 className="wm-h-title">
                                                {branch.name}
                                            </h3>
                                            <ul>
                                                {items.map((item, idx) => (
                                                    <li key={idx}>
                                                        <div className="twm-get-info">
                                                            <div className="twm-media">
                                                                <i
                                                                    className={
                                                                        item.icon
                                                                    }
                                                                ></i>
                                                            </div>
                                                            <div className="twm-content">
                                                                <p>
                                                                    {item.label}
                                                                </p>
                                                                <h3 className="twm-title">
                                                                    {item.href ? (
                                                                        <a
                                                                            href={
                                                                                item.href
                                                                            }
                                                                        >
                                                                            {
                                                                                item.value
                                                                            }
                                                                        </a>
                                                                    ) : (
                                                                        item.value
                                                                    )}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
