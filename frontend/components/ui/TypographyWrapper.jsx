"use client";

import React from 'react';
import { 
  H1 as LeafyH1, 
  H2 as LeafyH2, 
  H3 as LeafyH3,
  Body as LeafyBody,
  Subtitle as LeafySubtitle
} from '@leafygreen-ui/typography';
import LeafyCard from '@leafygreen-ui/card';
import LeafyButton from '@leafygreen-ui/button';
import { Spinner as LeafySpinner } from '@leafygreen-ui/loading-indicator';

// Simple wrapper components that explicitly set the 'as' prop
export const MyH1 = (props) => <LeafyH1 {...props}>{props.children}</LeafyH1>;
export const MyH2 = (props) => <LeafyH2 {...props}>{props.children}</LeafyH2>;
export const MyH3 = (props) => <LeafyH3 {...props}>{props.children}</LeafyH3>;
export const MyBody = (props) => <LeafyBody {...props}>{props.children}</LeafyBody>;
export const MySubtitle = (props) => <LeafySubtitle {...props}>{props.children}</LeafySubtitle>;

// Card wrapper
export const MyCard = (props) => <LeafyCard {...props}>{props.children}</LeafyCard>;

// Button wrapper
export const MyButton = (props) => <LeafyButton {...props}>{props.children}</LeafyButton>;

// Spinner wrapper
export const MySpinner = (props) => <LeafySpinner {...props} />;