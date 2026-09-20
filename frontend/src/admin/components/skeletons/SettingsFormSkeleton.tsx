import { Card, Row, Col } from 'react-bootstrap';
import { SkeletonFormRows } from '@/shared/components/ui/Skeleton';

interface SettingsFormSkeletonProps {
    /* Number of form cards to show */
    cards?: number;
    /* Show a two-column layout (side-by-side cards) */
    twoColumn?: boolean;
}

export function SettingsFormSkeleton({
    cards = 1,
    twoColumn = false,
}: SettingsFormSkeletonProps) {
    const cardElements = Array.from({ length: cards }).map((_, i) => (
        <Card className="border-0 shadow-sm mb-3" key={i}>
            <Card.Header className="bg-white border-bottom">
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-4 rounded"
                        style={{ height: '1rem' }}
                    />
                </div>
            </Card.Header>
            <Card.Body>
                <SkeletonFormRows rows={5} />
                <div className="placeholder-glow mt-3">
                    <span
                        className="placeholder col-2 rounded"
                        style={{ height: '2.2rem' }}
                    />
                </div>
            </Card.Body>
        </Card>
    ));

    if (twoColumn) {
        return (
            <div className="pb-4">
                {/* Page title */}
                <div className="page-titles mb-3">
                    <div className="placeholder-glow mb-1">
                        <span
                            className="placeholder col-3 rounded"
                            style={{ height: '1.3rem' }}
                        />
                    </div>
                </div>
                <Row className="g-3">
                    {cardElements.map((el, i) => (
                        <Col md={6} key={i}>
                            {el}
                        </Col>
                    ))}
                </Row>
            </div>
        );
    }

    return (
        <div className="pb-4">
            {/* Page title */}
            <div className="page-titles mb-3">
                <div className="placeholder-glow mb-1">
                    <span
                        className="placeholder col-3 rounded"
                        style={{ height: '1.3rem' }}
                    />
                </div>
            </div>
            {cardElements}
        </div>
    );
}
