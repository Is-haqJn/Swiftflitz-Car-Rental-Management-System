import { useTitle } from '@/shared/hooks';
import {
    OurValues,
    BannerSection,
    GeneralAboutUsSection,
    TeamSection,
} from './sections';

const About = () => {
    const title = useTitle('About Us');
    return (
        <>
            {title}
            <BannerSection />
            <GeneralAboutUsSection />
            <OurValues />
            <TeamSection />
        </>
    );
};

export default About;
