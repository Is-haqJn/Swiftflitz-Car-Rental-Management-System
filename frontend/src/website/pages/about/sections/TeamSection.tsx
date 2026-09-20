import { useAboutSettings } from '@/shared/hooks/queries/useSettings';

export const TeamSection = () => {
    const { data: settingsRes } = useAboutSettings();
    const s = settingsRes?.data;

    if (s?.team_enabled === false) {
        return null;
    }

    const title = s?.team_title ?? 'Swiftflitz Team';
    const largeTitle = s?.team_large_title ?? 'The Swiftflitz Team';
    const members = s?.team_members ?? [];

    return (
        <>
            {/* Team SECTION START */}
            <div className="section-full p-t150 p-b120 site-bg-white twm-team2-section-wrap">
                <div className="container">
                    <div className="section-content">
                        {/* TITLE START*/}
                        <div className="section-head center">
                            <div className="twm-sm-title left">{title}</div>
                            <h2 className="twm-large-title site-text-dark">
                                {largeTitle}
                            </h2>
                        </div>
                        {/* TITLE END*/}
                        <div className="row">
                            {members.map((member, index) => (
                                <div
                                    key={index}
                                    className="col-lg-3 col-md-6 col-sm-6 m-b30 wow fadeInDown"
                                    data-wow-delay="0.2"
                                >
                                    <div className="twm-team-section">
                                        <div className="twm-team-info">
                                            <h2 className="twm-title">
                                                {member.name}
                                            </h2>
                                            <div className="twm-s-title">
                                                {member.position}
                                            </div>
                                        </div>
                                        <div
                                            className="twm-team-media"
                                            style={{ aspectRatio: '3/4' }}
                                        >
                                            <img
                                                src={
                                                    member.image_url ||
                                                    'assets/images/team/1.jpg'
                                                }
                                                alt={member.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            {member.socials &&
                                                member.socials.length > 0 && (
                                                    <div className="twm-team-social">
                                                        <ul>
                                                            {member.socials.map(
                                                                (
                                                                    social,
                                                                    si
                                                                ) => (
                                                                    <li
                                                                        key={si}
                                                                    >
                                                                        <a
                                                                            href={
                                                                                social.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <i
                                                                                className={
                                                                                    social.icon
                                                                                }
                                                                            ></i>
                                                                        </a>
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Team SECTION END */}
        </>
    );
};
