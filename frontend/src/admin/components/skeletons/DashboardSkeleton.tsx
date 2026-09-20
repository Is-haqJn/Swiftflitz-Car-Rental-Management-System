import { Card, Row, Col, Table } from 'react-bootstrap';
import {
    SkeletonStatCard,
    SkeletonTableRows,
} from '@/shared/components/ui/Skeleton';
import { ChartSkeleton } from './ChartSkeleton';

/* Donut chart area placeholder */
function DonutSkeleton() {
    return (
        <Card className="h-100">
            <Card.Header className="bg-white border-bottom">
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-6 rounded"
                        style={{ height: '1rem' }}
                    />
                </div>
            </Card.Header>
            <Card.Body className="d-flex justify-content-center align-items-center">
                <div
                    className="placeholder-glow d-flex justify-content-center align-items-center"
                    style={{ width: 160, height: 160 }}
                >
                    <span
                        className="placeholder rounded-circle"
                        style={{ width: 160, height: 160 }}
                    />
                </div>
            </Card.Body>
        </Card>
    );
}

/* Quick stats placeholder */
function QuickStatsSkeleton() {
    return (
        <Card className="h-100">
            <Card.Header className="bg-white border-bottom">
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-4 rounded"
                        style={{ height: '1rem' }}
                    />
                </div>
            </Card.Header>
            <Card.Body>
                <Row className="g-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Col xs={6} key={i}>
                            <div className="p-3 rounded border text-center placeholder-glow">
                                <span
                                    className="placeholder col-6 rounded d-block mb-1"
                                    style={{ height: '1.5rem' }}
                                />
                                <span
                                    className="placeholder col-9 rounded d-block"
                                    style={{ height: '0.7rem' }}
                                />
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card.Body>
        </Card>
    );
}

/* Recent table card placeholder */
function TableCardSkeleton({
    cols = 5,
    title = '',
}: {
    cols?: number;
    title?: string;
}) {
    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-8 rounded"
                        style={{
                            height: '1rem',
                            width: title ? undefined : '8rem',
                            display: 'inline-block',
                        }}
                    />
                </div>
                <span
                    className="placeholder col-2 rounded"
                    style={{
                        height: '1.8rem',
                        width: '5rem',
                        display: 'inline-block',
                    }}
                />
            </Card.Header>
            <Card.Body className="p-0">
                <Table className="mb-0">
                    <thead>
                        <tr>
                            {Array.from({ length: cols }).map((_, i) => (
                                <th key={i}>
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-8 rounded" />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <SkeletonTableRows rows={5} cols={cols} />
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="pb-4">
            {/* Page title */}
            <div className="page-titles mb-3">
                <div className="placeholder-glow mb-1">
                    <span
                        className="placeholder col-2 rounded"
                        style={{ height: '1.4rem' }}
                    />
                </div>
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-4 rounded"
                        style={{ height: '0.75rem' }}
                    />
                </div>
            </div>

            {/* KPI stat cards */}
            <Row className="g-3 mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Col xl={3} md={6} key={i}>
                        <SkeletonStatCard />
                    </Col>
                ))}
            </Row>

            {/* Airport + Chauffeur stat cards */}
            <Row className="g-3 mb-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Col xl={3} md={6} key={i}>
                        <SkeletonStatCard />
                    </Col>
                ))}
            </Row>

            {/* Charts row */}
            <Row className="g-3 mb-4">
                <Col xl={5} lg={12}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div className="placeholder-glow">
                                <span
                                    className="placeholder col-6 rounded"
                                    style={{ height: '1rem' }}
                                />
                            </div>
                            <div className="placeholder-glow d-flex gap-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <span
                                        key={i}
                                        className="placeholder rounded"
                                        style={{
                                            width: 48,
                                            height: '1.6rem',
                                            display: 'inline-block',
                                        }}
                                    />
                                ))}
                            </div>
                        </Card.Header>
                        <Card.Body className="pt-2 pb-0">
                            <ChartSkeleton height={260} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={4} lg={6}>
                    <DonutSkeleton />
                </Col>
                <Col xl={3} lg={6}>
                    <DonutSkeleton />
                </Col>
            </Row>

            {/* Rental distribution + quick stats */}
            <Row className="g-3 mb-4">
                <Col xl={4} md={6}>
                    <DonutSkeleton />
                </Col>
                <Col xl={8} md={6}>
                    <QuickStatsSkeleton />
                </Col>
            </Row>

            {/* Recent rentals + upcoming returns */}
            <Row className="g-3">
                <Col lg={7}>
                    <TableCardSkeleton cols={5} />
                </Col>
                <Col lg={5}>
                    <TableCardSkeleton cols={4} />
                </Col>
            </Row>
        </div>
    );
}
